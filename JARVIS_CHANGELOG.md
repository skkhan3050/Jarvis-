# Jarvis Personal AI Operating System — Changelog

All notable changes and architectural enhancements made to the existing Jarvis codebase are documented here.

---

## [v3.0.0] - 2026-11-18

### Added
- **AI Master Agent (`src/openjarvis/agents/master_agent.py`):** Central orchestrator for intent classification, domain task routing, n8n webhook dispatching, and specialist coordination.
- **Dedicated Specialist Agents (`src/openjarvis/agents/specialists/`):**
  - `meta_ads.py` (`JARVIS_02_META_ADS`): Meta Ads ROAS, creative fatigue, and budget auditor.
  - `google_ads.py` (`JARVIS_03_GOOGLE_ADS`): Google Ads wasted spend, negative keywords, and CPA analyzer.
  - `seo.py` (`JARVIS_04_SEO`): Technical SEO crawl, Core Web Vitals, and keyword clustering.
  - `research.py` (`JARVIS_05_RESEARCH`): Deep web competitor intelligence powered by Tavily and strategic synthesis.
  - `gmail.py` (`JARVIS_06_GMAIL`): Executive email triage, thread summarization, and approval-gated email delivery.
  - `personal.py` (`JARVIS_07_PERSONAL`): Daily agenda, time-blocking, standup synthesis, and morning briefing.
- **n8n Workflow Automation Integration (`src/openjarvis/services/n8n_service.py` & `src/openjarvis/server/n8n_routes.py`):**
  - Secure outbound HTTPS communication to cloud n8n webhooks (`/webhook/jarvis-chat`).
  - Request/Response validation, retry with exponential backoff, timeout handling, and local mock fallback.
  - Asynchronous task ID tracking and polling endpoints (`GET /v1/n8n/tasks/{id}`).
- **Supabase Long-Term Memory & Dual-Mode Persistence (`src/openjarvis/services/supabase_service.py`):**
  - SQL migration schema (`migrations/supabase/001_initial_schema.sql`) covering `users`, `conversations`, `messages`, `memories`, `agent_tasks`, `agent_executions`, `approvals`, `integrations`, and `system_logs` with RLS policies.
  - Automatic zero-downtime fallback to local SQLite when offline.
- **Centralized Human Approval Gateway (`src/openjarvis/security/approval_gateway.py`):**
  - Gated execution policies for sensitive actions (ad budgets, campaign pausing, live email sends).
  - Integrated with REST approval endpoints (`/v1/approvals/pending`, `/v1/approvals/{id}/approve`, `/v1/approvals/{id}/deny`).
- **Model Context Protocol (MCP) Tools (`src/openjarvis/tools/specialist_tools.py`):**
  - Registered `meta_ads`, `google_ads`, `seo_audit`, `deep_research`, `gmail_assistant`, and `n8n_workflow` into `ToolRegistry`.
- **Master & Specialist Router (`src/openjarvis/server/master_routes.py`):**
  - Added `POST /v1/master/dispatch`, `GET /v1/master/specialists`, and `GET /v1/master/status`.
- **Comprehensive Documentation & Configuration:**
  - `JARVIS_ARCHITECTURE_AUDIT.md`
  - `JARVIS_IMPLEMENTATION_PLAN.md`
  - `JARVIS_API_DOCUMENTATION.md`
  - `JARVIS_AGENT_DOCUMENTATION.md`
  - `JARVIS_DATABASE_SCHEMA.md`
  - `JARVIS_SECURITY_GUIDE.md`
  - `JARVIS_TEST_REPORT.md`
  - `JARVIS_CHANGELOG.md`
  - `.env.example`
- **Integration Test Suite (`tests/integration/test_jarvis_operating_system.py`):**
  - 5/5 tests passing with 100% success rate.
- **Widescreen Sci-Fi HUD & Multilingual Hologram (`frontend/`):**
  - Command Center with 3D Holographic AI Core, active agent equalizers, and live gauges.
  - Dynamic SVG mouth-movement lip-sync audio reactive hologram.
  - Multilingual voice support for Bengali (`bn-IN`), Hindi (`hi-IN`), and English (`en-US`).
