"""FastAPI router for n8n workflow integration."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from openjarvis.services.n8n_service import (
    N8nChatRequest,
    N8nChatResponse,
    N8nExecutionStatus,
    get_n8n_service,
)

logger = logging.getLogger(__name__)

n8n_router = APIRouter(prefix="/v1/n8n", tags=["n8n"])


class N8nDispatchRequest(BaseModel):
    workflow_name: str
    payload: Dict[str, Any]
    user_id: str = "commander"
    is_test: bool = False


@n8n_router.get("/health")
async def check_n8n_health() -> Dict[str, Any]:
    """Check connectivity to the configured n8n instance."""
    service = get_n8n_service()
    return await service.check_connection()


@n8n_router.post("/chat", response_model=N8nChatResponse)
async def dispatch_n8n_chat(
    request: N8nChatRequest,
    is_test: bool = Query(default=False, description="Use test webhook URL"),
) -> N8nChatResponse:
    """Dispatch a chat automation request to n8n."""
    service = get_n8n_service()
    return await service.dispatch_chat(request, is_test=is_test)


@n8n_router.post("/dispatch", response_model=N8nChatResponse)
async def dispatch_generic_workflow(
    req: N8nDispatchRequest,
) -> N8nChatResponse:
    """Dispatch a targeted workflow request to n8n."""
    service = get_n8n_service()
    chat_req = N8nChatRequest(
        message=f"Execute workflow: {req.workflow_name}",
        user_id=req.user_id,
        agent_type=req.workflow_name,
        parameters=req.payload,
    )
    return await service.dispatch_chat(chat_req, is_test=req.is_test)


@n8n_router.get("/tasks/{task_id}", response_model=N8nExecutionStatus)
async def get_task_status(task_id: str) -> N8nExecutionStatus:
    """Retrieve async execution status of a task."""
    service = get_n8n_service()
    status = service.get_task_status(task_id)
    if not status:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return status


@n8n_router.get("/tasks", response_model=List[N8nExecutionStatus])
async def list_recent_tasks(
    limit: int = Query(default=20, ge=1, le=100),
) -> List[N8nExecutionStatus]:
    """List recent n8n tasks dispatched by Jarvis."""
    service = get_n8n_service()
    return service.list_recent_tasks(limit=limit)
