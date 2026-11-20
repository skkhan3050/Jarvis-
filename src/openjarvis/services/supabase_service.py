"""Supabase Memory and Persistence Service for Jarvis Personal AI OS.

Provides dual-mode storage:
1. Cloud Supabase PostgreSQL when SUPABASE_URL and SUPABASE_KEY are configured.
2. Local SQLite fallback storage when offline or unconfigured, ensuring zero downtime.
"""

from __future__ import annotations

import logging
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx

from openjarvis.core.paths import get_config_dir

logger = logging.getLogger(__name__)


class SupabaseMemoryService:
    """Manages conversational memory, agent tasks, executions, and audit logs."""

    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
        fallback_db_path: Optional[Path] = None,
    ) -> None:
        self.supabase_url = (
            supabase_url
            or os.environ.get("SUPABASE_URL", "")
            or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
        ).rstrip("/")
        self.supabase_key = (
            supabase_key
            or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
            or os.environ.get("SUPABASE_ANON_KEY", "")
            or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
        )

        if fallback_db_path is None:
            config_dir = get_config_dir()
            fallback_db_path = config_dir / "jarvis_supabase_fallback.db"

        self.fallback_db_path = fallback_db_path
        self._init_local_fallback()

    def _init_local_fallback(self) -> None:
        """Initialize local SQLite tables to mirror Supabase schema when offline."""
        self.fallback_db_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.fallback_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS local_memories (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    category TEXT,
                    content TEXT,
                    importance INTEGER DEFAULT 3,
                    metadata TEXT,
                    created_at TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS local_agent_tasks (
                    id TEXT PRIMARY KEY,
                    task_id TEXT UNIQUE,
                    agent_name TEXT,
                    category TEXT,
                    status TEXT,
                    requires_approval INTEGER DEFAULT 0,
                    input_payload TEXT,
                    output_payload TEXT,
                    error_message TEXT,
                    created_at TEXT,
                    completed_at TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS local_system_logs (
                    id TEXT PRIMARY KEY,
                    level TEXT,
                    component TEXT,
                    message TEXT,
                    metadata TEXT,
                    created_at TEXT
                )
            """)
            conn.commit()

    @property
    def is_configured(self) -> bool:
        """Check if Supabase credentials are present."""
        return bool(self.supabase_url and self.supabase_key)

    async def check_health(self) -> Dict[str, Any]:
        """Verify Supabase connection health."""
        if not self.is_configured:
            return {
                "status": "fallback_local",
                "mode": "sqlite",
                "database_path": str(self.fallback_db_path),
                "message": "Supabase credentials not configured. Using local fallback.",
            }

        try:
            # Query the users table with limit 1 via REST API
            endpoint = f"{self.supabase_url}/rest/v1/users?select=id&limit=1"
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
            }
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(endpoint, headers=headers)
                if resp.status_code in (200, 206):
                    return {
                        "status": "connected",
                        "mode": "supabase_cloud",
                        "url": self.supabase_url,
                        "latency_ms": round(resp.elapsed.total_seconds() * 1000, 2),
                    }
                else:
                    return {
                        "status": "error",
                        "mode": "fallback_local",
                        "status_code": resp.status_code,
                        "detail": resp.text[:200],
                    }
        except Exception as exc:
            return {
                "status": "unreachable",
                "mode": "fallback_local",
                "error": str(exc),
            }

    async def store_memory(
        self,
        content: str,
        user_id: str = "commander",
        category: str = "general",
        importance: int = 3,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Store long-term memory in Supabase or local SQLite."""
        mem_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        meta = metadata or {}

        if self.is_configured:
            try:
                endpoint = f"{self.supabase_url}/rest/v1/memories"
                headers = {
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                }
                payload = {
                    "id": mem_id,
                    "user_id": user_id if len(user_id) == 36 else None,
                    "category": category,
                    "content": content,
                    "importance": importance,
                    "metadata": meta,
                    "created_at": now_iso,
                }
                async with httpx.AsyncClient(timeout=6.0) as client:
                    resp = await client.post(endpoint, json=payload, headers=headers)
                    if resp.status_code in (200, 201):
                        return {"success": True, "id": mem_id, "backend": "supabase"}
            except Exception as exc:
                logger.warning("Supabase memory insert failed, saving to local: %s", exc)

        # Local fallback
        import json
        with sqlite3.connect(self.fallback_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO local_memories (id, user_id, category, content, importance, metadata, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (mem_id, user_id, category, content, importance, json.dumps(meta), now_iso),
            )
            conn.commit()

        return {"success": True, "id": mem_id, "backend": "sqlite_fallback"}

    async def search_memories(
        self,
        query: str,
        user_id: str = "commander",
        category: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search memories by keyword content."""
        if self.is_configured:
            try:
                # Text ilike search in Supabase
                endpoint = f"{self.supabase_url}/rest/v1/memories?content=ilike.*{query}*&limit={limit}&order=importance.desc,created_at.desc"
                if category:
                    endpoint += f"&category=eq.{category}"
                headers = {
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}",
                }
                async with httpx.AsyncClient(timeout=6.0) as client:
                    resp = await client.get(endpoint, headers=headers)
                    if resp.status_code == 200:
                        return resp.json()
            except Exception as exc:
                logger.warning("Supabase memory search failed, searching local: %s", exc)

        # Local SQLite search
        import json
        results = []
        with sqlite3.connect(self.fallback_db_path) as conn:
            cursor = conn.cursor()
            sql = "SELECT id, user_id, category, content, importance, metadata, created_at FROM local_memories WHERE content LIKE ? "
            params: List[Any] = [f"%{query}%"]
            if category:
                sql += "AND category = ? "
                params.append(category)
            sql += "ORDER BY importance DESC, created_at DESC LIMIT ?"
            params.append(limit)

            cursor.execute(sql, params)
            for row in cursor.fetchall():
                try:
                    meta = json.loads(row[5]) if row[5] else {}
                except Exception:
                    meta = {}
                results.append({
                    "id": row[0],
                    "user_id": row[1],
                    "category": row[2],
                    "content": row[3],
                    "importance": row[4],
                    "metadata": meta,
                    "created_at": row[6],
                })
        return results

    async def record_task(
        self,
        task_id: str,
        agent_name: str,
        category: str,
        input_payload: Dict[str, Any],
        requires_approval: bool = False,
    ) -> str:
        """Record a new agent task."""
        now_iso = datetime.now(timezone.utc).isoformat()
        import json

        if self.is_configured:
            try:
                endpoint = f"{self.supabase_url}/rest/v1/agent_tasks"
                headers = {
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "task_id": task_id,
                    "agent_name": agent_name,
                    "category": category,
                    "status": "waiting_approval" if requires_approval else "running",
                    "requires_approval": requires_approval,
                    "input_payload": input_payload,
                    "created_at": now_iso,
                }
                async with httpx.AsyncClient(timeout=6.0) as client:
                    await client.post(endpoint, json=payload, headers=headers)
            except Exception as exc:
                logger.warning("Supabase task record failed: %s", exc)

        # Local fallback
        with sqlite3.connect(self.fallback_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT OR REPLACE INTO local_agent_tasks 
                   (id, task_id, agent_name, category, status, requires_approval, input_payload, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    task_id,
                    task_id,
                    agent_name,
                    category,
                    "waiting_approval" if requires_approval else "running",
                    1 if requires_approval else 0,
                    json.dumps(input_payload),
                    now_iso,
                ),
            )
            conn.commit()

        return task_id

    async def update_task_status(
        self,
        task_id: str,
        status: str,
        output_payload: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ) -> None:
        """Update task completion status and output."""
        now_iso = datetime.now(timezone.utc).isoformat()
        import json

        if self.is_configured:
            try:
                endpoint = f"{self.supabase_url}/rest/v1/agent_tasks?task_id=eq.{task_id}"
                headers = {
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}",
                    "Content-Type": "application/json",
                }
                body: Dict[str, Any] = {"status": status, "completed_at": now_iso}
                if output_payload is not None:
                    body["output_payload"] = output_payload
                if error_message is not None:
                    body["error_message"] = error_message

                async with httpx.AsyncClient(timeout=6.0) as client:
                    await client.patch(endpoint, json=body, headers=headers)
            except Exception as exc:
                logger.warning("Supabase task update failed: %s", exc)

        with sqlite3.connect(self.fallback_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """UPDATE local_agent_tasks 
                   SET status = ?, output_payload = ?, error_message = ?, completed_at = ?
                   WHERE task_id = ?""",
                (
                    status,
                    json.dumps(output_payload or {}),
                    error_message,
                    now_iso,
                    task_id,
                ),
            )
            conn.commit()

    async def log_event(
        self,
        level: str,
        component: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Write an audit or system event log."""
        now_iso = datetime.now(timezone.utc).isoformat()
        import json
        log_id = str(uuid.uuid4())
        meta = metadata or {}

        if self.is_configured:
            try:
                endpoint = f"{self.supabase_url}/rest/v1/system_logs"
                headers = {
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "id": log_id,
                    "level": level.upper(),
                    "component": component,
                    "message": message,
                    "metadata": meta,
                    "created_at": now_iso,
                }
                async with httpx.AsyncClient(timeout=4.0) as client:
                    await client.post(endpoint, json=payload, headers=headers)
            except Exception:
                pass

        with sqlite3.connect(self.fallback_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO local_system_logs (id, level, component, message, metadata, created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (log_id, level.upper(), component, message, json.dumps(meta), now_iso),
            )
            conn.commit()


_default_supabase_service: Optional[SupabaseMemoryService] = None


def get_supabase_service() -> SupabaseMemoryService:
    """Return the global SupabaseMemoryService instance."""
    global _default_supabase_service
    if _default_supabase_service is None:
        _default_supabase_service = SupabaseMemoryService()
    return _default_supabase_service
