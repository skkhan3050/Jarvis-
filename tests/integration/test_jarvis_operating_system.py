"""Integration test suite for Jarvis Personal AI Operating System."""

from __future__ import annotations

import asyncio
import pytest
from openjarvis.agents.master_agent import MasterAIAgent, get_master_agent
from openjarvis.agents.specialists.meta_ads import MetaAdsSpecialist
from openjarvis.agents.specialists.google_ads import GoogleAdsSpecialist
from openjarvis.agents.specialists.seo import SEOSpecialist
from openjarvis.agents.specialists.research import ResearchSpecialist
from openjarvis.agents.specialists.gmail import GmailSpecialist
from openjarvis.agents.specialists.personal import PersonalAssistantSpecialist
from openjarvis.security.approval_gateway import ApprovalGateway, get_approval_gateway
from openjarvis.services.n8n_service import N8nChatRequest, N8nService
from openjarvis.services.supabase_service import SupabaseMemoryService
from openjarvis.core.registry import ToolRegistry


@pytest.mark.asyncio
async def test_n8n_service_mock_fallback():
    service = N8nService(base_url="", webhook_url="")
    assert not service.is_configured

    health = await service.check_connection()
    assert health["status"] in ("mock_mode", "unconfigured")

    req = N8nChatRequest(message="Test query", conversation_id="conv_123")
    res = await service.dispatch_chat(req)
    assert res.success is True
    assert res.status == "completed"
    assert "mock fallback" in res.message.lower()


@pytest.mark.asyncio
async def test_supabase_service_fallback(tmp_path):
    db_file = tmp_path / "test_fallback.db"
    svc = SupabaseMemoryService(supabase_url="", supabase_key="", fallback_db_path=db_file)
    assert not svc.is_configured

    # Store memory in local fallback
    mem = await svc.store_memory(
        content="Meeting with CTO about Jarvis Operating System",
        category="work",
        importance=4,
    )
    assert mem["success"] is True
    assert mem["backend"] == "sqlite_fallback"

    # Search memory
    results = await svc.search_memories("CTO")
    assert len(results) >= 1
    assert "CTO" in results[0]["content"]


@pytest.mark.asyncio
async def test_approval_gateway_policy():
    gateway = get_approval_gateway()

    # 1. Read-only SEO audit: should be auto-approved
    approved, act_id, msg = await gateway.evaluate_or_request_approval(
        agent_name="JARVIS_04_SEO",
        action_type="seo_audit",
        description="Audit website",
        payload={},
    )
    assert approved is True
    assert act_id is None

    # 2. Meta Ads budget update: should require human approval
    approved_budget, act_id_budget, msg_budget = await gateway.evaluate_or_request_approval(
        agent_name="JARVIS_02_META_ADS",
        action_type="meta_ads_update_budget",
        description="Increase budget by $500",
        payload={"amount": 500},
    )
    assert approved_budget is False
    assert act_id_budget is not None
    assert "requires human authorization" in msg_budget


@pytest.mark.asyncio
async def test_master_agent_classification_and_routing():
    agent = MasterAIAgent()

    # Intent classification
    assert agent.classify_intent("Analyze my Meta Ads campaigns")[0] == "meta_ads"
    assert agent.classify_intent("Check Google Ads wasted spend and negative keywords")[0] == "google_ads"
    assert agent.classify_intent("Run an SEO technical audit for my website")[0] == "seo"
    assert agent.classify_intent("Summarize my Gmail unread emails")[0] == "gmail"
    assert agent.classify_intent("What is my schedule for today?")[0] == "personal"
    assert agent.classify_intent("Research competitor AI architectures")[0] == "research"
    assert agent.classify_intent("Hello, who are you?")[0] == "general_chat"

    # Route and execute Meta Ads
    res_meta = await agent.route_and_execute("Analyze my Meta Ads campaigns")
    assert res_meta["handled"] is True
    assert res_meta["category"] == "meta_ads"
    assert "ROAS" in res_meta["summary"]

    # Route and execute SEO
    res_seo = await agent.route_and_execute("Run an SEO audit for my site")
    assert res_seo["handled"] is True
    assert res_seo["category"] == "seo"
    assert "Health Score" in res_seo["summary"]


def test_specialist_tools_in_registry():
    import openjarvis.tools.specialist_tools  # Ensure registration runs
    keys = list(ToolRegistry.keys())

    assert "meta_ads" in keys
    assert "google_ads" in keys
    assert "seo_audit" in keys
    assert "deep_research" in keys
    assert "gmail_assistant" in keys
    assert "n8n_workflow" in keys
