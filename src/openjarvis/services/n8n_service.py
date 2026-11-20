"""n8n Automation Platform Integration Service for Jarvis.

Provides secure, authenticated outbound HTTPS communication with local or cloud
n8n instances. Handles request/response validation, execution tracking, retry
mechanisms with exponential backoff, and asynchronous task tracking.
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
import uuid
from typing import Any, Dict, Optional
import httpx
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Default timeout for synchronous webhook calls (seconds)
DEFAULT_WEBHOOK_TIMEOUT = 30.0
MAX_RETRIES = 3
INITIAL_BACKOFF = 1.0


class N8nChatRequest(BaseModel):
    """Payload sent from Jarvis to n8n webhook."""
    message: str
    conversation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "commander"
    source: str = "jarvis"
    agent_type: Optional[str] = "master"
    parameters: Dict[str, Any] = Field(default_factory=dict)


class N8nChatResponse(BaseModel):
    """Validated response from n8n webhook back to Jarvis."""
    success: bool
    assistant: str = "Jarvis"
    message: str
    task_id: Optional[str] = None
    execution_id: Optional[str] = None
    status: str = "completed"
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class N8nExecutionStatus(BaseModel):
    """Status model for asynchronous task polling."""
    task_id: str
    execution_id: Optional[str] = None
    status: str  # pending, running, completed, failed
    progress_percent: int = 0
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class N8nService:
    """Manages secure outbound communication with n8n."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        webhook_url: Optional[str] = None,
        webhook_test_url: Optional[str] = None,
        auth_header: Optional[str] = None,
        auth_value: Optional[str] = None,
        timeout: float = DEFAULT_WEBHOOK_TIMEOUT,
    ) -> None:
        if base_url is not None:
            self.base_url = base_url.rstrip("/")
        else:
            self.base_url = os.environ.get("JARVIS_N8N_BASE_URL", "").rstrip("/")
        if webhook_url is not None:
            self.webhook_url = webhook_url
        else:
            self.webhook_url = os.environ.get(
                "JARVIS_N8N_WEBHOOK_URL",
                f"{self.base_url}/webhook/jarvis-chat" if self.base_url else ""
            )
        self.webhook_test_url = webhook_test_url or os.environ.get(
            "JARVIS_N8N_WEBHOOK_TEST_URL",
            f"{self.base_url}/webhook-test/jarvis-chat" if self.base_url else ""
        )
        self.auth_header = auth_header or os.environ.get("JARVIS_N8N_AUTH_HEADER", "X-Jarvis-Key")
        self.auth_value = auth_value or os.environ.get("JARVIS_N8N_AUTH_VALUE", "")
        self.timeout = timeout

        # In-memory execution store for local async tracking
        self._task_store: Dict[str, N8nExecutionStatus] = {}

    @property
    def is_configured(self) -> bool:
        """Return True if a webhook URL is configured."""
        return bool(self.webhook_url or self.base_url)

    def _build_headers(self) -> Dict[str, str]:
        """Construct secure authentication headers."""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Jarvis-Personal-OS/3.0.0",
        }
        if self.auth_header and self.auth_value:
            headers[self.auth_header] = self.auth_value
        return headers

    async def check_connection(self) -> Dict[str, Any]:
        """Verify connectivity to n8n instance without throwing exceptions."""
        if not self.base_url and not self.webhook_url:
            return {
                "connected": False,
                "status": "unconfigured",
                "message": "n8n URL not configured in .env (JARVIS_N8N_BASE_URL or JARVIS_N8N_WEBHOOK_URL)",
            }

        target_url = f"{self.base_url}/healthz" if self.base_url else self.webhook_url
        try:
            async with httpx.AsyncClient(timeout=5.0, verify=True) as client:
                res = await client.get(target_url, headers=self._build_headers())
                is_ok = res.status_code in (200, 204, 404, 405)  # 404/405 means host is alive
                return {
                    "connected": is_ok,
                    "status_code": res.status_code,
                    "url": target_url,
                    "message": "n8n endpoint reached successfully" if is_ok else f"HTTP {res.status_code}",
                }
        except httpx.ConnectError:
            return {
                "connected": False,
                "status": "unreachable",
                "message": f"Connection refused to {target_url}",
            }
        except Exception as exc:
            return {
                "connected": False,
                "status": "error",
                "message": str(exc),
            }

    async def dispatch_chat(
        self,
        request: N8nChatRequest,
        is_test: bool = False,
    ) -> N8nChatResponse:
        """Send chat payload to n8n webhook with retry and validation."""
        target_url = self.webhook_test_url if is_test else self.webhook_url
        task_id = f"task_{uuid.uuid4().hex[:12]}"

        # Initialize local task tracker
        self._task_store[task_id] = N8nExecutionStatus(
            task_id=task_id,
            status="running",
            progress_percent=10,
        )

        if not target_url:
            logger.info("n8n webhook URL unconfigured. Returning local simulated response for task %s", task_id)
            self._task_store[task_id].status = "completed"
            self._task_store[task_id].progress_percent = 100
            return N8nChatResponse(
                success=True,
                assistant="Jarvis",
                message=f"[Local Mock Fallback] Processed: '{request.message}'. (Configure JARVIS_N8N_WEBHOOK_URL to connect live n8n).",
                task_id=task_id,
                execution_id=f"exec_{uuid.uuid4().hex[:8]}",
                status="completed",
                data={"agent": request.agent_type, "source": "local_mock"},
            )

        payload = request.model_dump()
        payload["task_id"] = task_id
        headers = self._build_headers()

        last_error = ""
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout, verify=True) as client:
                    logger.info("Outbound HTTPS dispatch to n8n (attempt %d/%d): %s", attempt, MAX_RETRIES, target_url)
                    response = await client.post(target_url, json=payload, headers=headers)

                    if response.status_code in (200, 201):
                        data = response.json() if response.content else {}
                        resp = N8nChatResponse(
                            success=data.get("success", True),
                            assistant=data.get("assistant", "Jarvis"),
                            message=data.get("message", "Task completed via n8n workflow."),
                            task_id=data.get("task_id", task_id),
                            execution_id=data.get("execution_id", f"exec_{uuid.uuid4().hex[:8]}"),
                            status=data.get("status", "completed"),
                            data=data.get("data", data),
                        )
                        self._task_store[task_id].status = "completed"
                        self._task_store[task_id].progress_percent = 100
                        self._task_store[task_id].execution_id = resp.execution_id
                        return resp
                    else:
                        last_error = f"n8n returned HTTP {response.status_code}: {response.text[:200]}"
                        logger.warning("n8n dispatch failed: %s", last_error)

            except (httpx.TimeoutException, httpx.NetworkError) as exc:
                last_error = f"Network failure connecting to n8n: {type(exc).__name__}"
                logger.warning("n8n connection error (attempt %d): %s", attempt, last_error)
            except Exception as exc:
                last_error = f"Unexpected error: {str(exc)}"
                logger.exception("n8n dispatch exception: %s", last_error)
                break

            if attempt < MAX_RETRIES:
                backoff = INITIAL_BACKOFF * (2 ** (attempt - 1))
                await asyncio.sleep(backoff)

        # Record failure in task store
        self._task_store[task_id].status = "failed"
        self._task_store[task_id].error = last_error

        return N8nChatResponse(
            success=False,
            assistant="Jarvis",
            message=f"n8n workflow execution failed after {MAX_RETRIES} attempts. {last_error}",
            task_id=task_id,
            status="failed",
            error=last_error,
        )

    def get_task_status(self, task_id: str) -> Optional[N8nExecutionStatus]:
        """Retrieve execution state for a task."""
        return self._task_store.get(task_id)

    def list_recent_tasks(self, limit: int = 20) -> list[N8nExecutionStatus]:
        """List recently tracked tasks."""
        return list(self._task_store.values())[-limit:]


# Global singleton instance
_n8n_instance: Optional[N8nService] = None


def get_n8n_service() -> N8nService:
    """Return the global singleton N8nService instance."""
    global _n8n_instance
    if _n8n_instance is None:
        _n8n_instance = N8nService()
    return _n8n_instance
