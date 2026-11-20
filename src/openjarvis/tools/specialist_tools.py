"""MCP-Compatible Specialist Tools registered in OpenJarvis ToolRegistry.

Provides:
- meta_ads: Meta Ads performance and creative auditing.
- google_ads: Google Ads search term, wasted spend, and CPA analysis.
- seo_audit: Technical SEO site audit and keyword opportunities.
- deep_research: Multi-source web intelligence and competitor analysis.
- gmail_assistant: Executive email triage and draft generation.
- n8n_workflow: Outbound webhook trigger for n8n automation workflows.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict

from openjarvis.core.registry import ToolRegistry
from openjarvis.core.types import ToolResult
from openjarvis.tools._stubs import BaseTool, ToolSpec
from openjarvis.agents.specialists.meta_ads import MetaAdsSpecialist
from openjarvis.agents.specialists.google_ads import GoogleAdsSpecialist
from openjarvis.agents.specialists.seo import SEOSpecialist
from openjarvis.agents.specialists.research import ResearchSpecialist
from openjarvis.agents.specialists.gmail import GmailSpecialist
from openjarvis.services.n8n_service import N8nChatRequest, get_n8n_service

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Run an async coroutine synchronously inside tool execution."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                return pool.submit(asyncio.run, coro).result()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


@ToolRegistry.register("meta_ads")
class MetaAdsTool(BaseTool):
    """Tool for querying and analyzing Meta advertising campaigns."""

    tool_id = "meta_ads"

    def __init__(self) -> None:
        self.specialist = MetaAdsSpecialist()

    @property
    def spec(self) -> ToolSpec:
        return ToolSpec(
            name="meta_ads",
            description="Audit Meta (Facebook/Instagram) ad campaigns, ROAS, and creative fatigue.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The ad analysis query or request"},
                    "action": {"type": "string", "enum": ["analyze", "update_budget", "pause_campaign"], "default": "analyze"},
                },
                "required": ["query"],
            },
            category="advertising",
        )

    def execute(self, **params: Any) -> ToolResult:
        query = params.get("query", "")
        action = params.get("action", "analyze")
        try:
            res = _run_async(self.specialist.execute_task(query=query, action=action, params=params))
            return ToolResult(
                tool_name="meta_ads",
                content=res.get("summary", json.dumps(res)),
                success=res.get("success", True),
                metadata=res,
            )
        except Exception as exc:
            return ToolResult(tool_name="meta_ads", content=f"Error executing Meta Ads tool: {exc}", success=False)


@ToolRegistry.register("google_ads")
class GoogleAdsTool(BaseTool):
    """Tool for auditing Google Ads search terms and wasted budget."""

    tool_id = "google_ads"

    def __init__(self) -> None:
        self.specialist = GoogleAdsSpecialist()

    @property
    def spec(self) -> ToolSpec:
        return ToolSpec(
            name="google_ads",
            description="Audit Google Ads search terms, detect wasted budget, and recommend negative keywords.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Analysis query or audit request"},
                    "action": {"type": "string", "enum": ["analyze", "add_negative_keywords", "update_cpa"], "default": "analyze"},
                },
                "required": ["query"],
            },
            category="advertising",
        )

    def execute(self, **params: Any) -> ToolResult:
        query = params.get("query", "")
        action = params.get("action", "analyze")
        try:
            res = _run_async(self.specialist.execute_task(query=query, action=action, params=params))
            return ToolResult(
                tool_name="google_ads",
                content=res.get("summary", json.dumps(res)),
                success=res.get("success", True),
                metadata=res,
            )
        except Exception as exc:
            return ToolResult(tool_name="google_ads", content=f"Error executing Google Ads tool: {exc}", success=False)


@ToolRegistry.register("seo_audit")
class SEOTool(BaseTool):
    """Tool for technical website SEO analysis and keyword discovery."""

    tool_id = "seo_audit"

    def __init__(self) -> None:
        self.specialist = SEOSpecialist()

    @property
    def spec(self) -> ToolSpec:
        return ToolSpec(
            name="seo_audit",
            description="Perform a technical SEO crawl, keyword opportunity analysis, or Core Web Vitals audit.",
            parameters={
                "type": "object",
                "properties": {
                    "domain": {"type": "string", "description": "Target domain or URL to audit"},
                    "query": {"type": "string", "description": "Optional specific focus topic"},
                },
                "required": ["domain"],
            },
            category="marketing",
        )

    def execute(self, **params: Any) -> ToolResult:
        domain = params.get("domain", "yourwebsite.com")
        query = params.get("query", f"Audit {domain}")
        try:
            res = _run_async(self.specialist.execute_task(query=query, action="audit", params={"domain": domain}))
            return ToolResult(
                tool_name="seo_audit",
                content=res.get("summary", json.dumps(res)),
                success=True,
                metadata=res,
            )
        except Exception as exc:
            return ToolResult(tool_name="seo_audit", content=f"Error running SEO audit: {exc}", success=False)


@ToolRegistry.register("deep_research")
class DeepResearchTool(BaseTool):
    """Tool for market research, competitor intelligence, and synthesis."""

    tool_id = "deep_research"

    def __init__(self) -> None:
        self.specialist = ResearchSpecialist()

    @property
    def spec(self) -> ToolSpec:
        return ToolSpec(
            name="deep_research",
            description="Gather competitor intelligence, investigate market trends, and produce executive briefs.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Research question or competitive intelligence topic"},
                },
                "required": ["query"],
            },
            category="research",
        )

    def execute(self, **params: Any) -> ToolResult:
        query = params.get("query", "")
        try:
            res = _run_async(self.specialist.execute_task(query=query))
            return ToolResult(
                tool_name="deep_research",
                content=res.get("summary", json.dumps(res)),
                success=res.get("success", True),
                metadata=res,
            )
        except Exception as exc:
            return ToolResult(tool_name="deep_research", content=f"Error running deep research: {exc}", success=False)


@ToolRegistry.register("gmail_assistant")
class GmailAssistantTool(BaseTool):
    """Tool for executive email triage, drafting, and gated email delivery."""

    tool_id = "gmail_assistant"

    def __init__(self) -> None:
        self.specialist = GmailSpecialist()

    @property
    def spec(self) -> ToolSpec:
        return ToolSpec(
            name="gmail_assistant",
            description="Triage inbox, summarize threads, compose email drafts, and trigger gated delivery.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Email task instruction"},
                    "action": {"type": "string", "enum": ["triage", "draft", "send_email"], "default": "triage"},
                    "to": {"type": "string", "description": "Recipient email address for draft or send"},
                    "subject": {"type": "string", "description": "Email subject line"},
                    "body": {"type": "string", "description": "Email body content"},
                },
                "required": ["query"],
            },
            category="communication",
        )

    def execute(self, **params: Any) -> ToolResult:
        query = params.get("query", "")
        action = params.get("action", "triage")
        try:
            res = _run_async(self.specialist.execute_task(query=query, action=action, params=params))
            return ToolResult(
                tool_name="gmail_assistant",
                content=res.get("summary", json.dumps(res)),
                success=res.get("success", True),
                metadata=res,
            )
        except Exception as exc:
            return ToolResult(tool_name="gmail_assistant", content=f"Error running Gmail tool: {exc}", success=False)


@ToolRegistry.register("n8n_workflow")
class N8nWorkflowTool(BaseTool):
    """Tool for triggering configured n8n workflows via outbound webhook."""

    tool_id = "n8n_workflow"

    def __init__(self) -> None:
        self.service = get_n8n_service()

    @property
    def spec(self) -> ToolSpec:
        return ToolSpec(
            name="n8n_workflow",
            description="Trigger an automated workflow in n8n via outbound webhook.",
            parameters={
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Workflow message or task instruction"},
                    "workflow_name": {"type": "string", "description": "Target workflow name"},
                    "is_test": {"type": "boolean", "default": False},
                },
                "required": ["message"],
            },
            category="automation",
        )

    def execute(self, **params: Any) -> ToolResult:
        message = params.get("message", "")
        is_test = params.get("is_test", False)
        req = N8nChatRequest(
            message=message,
            conversation_id="tool_call",
            user_id="commander",
            source="jarvis_tool",
        )
        try:
            res = _run_async(self.service.dispatch_chat(req, is_test=is_test))
            return ToolResult(
                tool_name="n8n_workflow",
                content=res.message,
                success=res.success,
                metadata={"task_id": res.task_id, "execution_id": res.execution_id, "data": res.data},
            )
        except Exception as exc:
            return ToolResult(tool_name="n8n_workflow", content=f"Error executing n8n tool: {exc}", success=False)
