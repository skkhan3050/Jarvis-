# JARVIS – PERSONAL AI OPERATING SYSTEM
## COMPREHENSIVE IMPLEMENTATION PLAN

**Target:** Modular, secure, multi-agent AI Operating System powered by n8n, Supabase, MCP, and local/cloud LLMs.  
**Rule:** Strictly preserve all working functionality, frontend design, and local configurations.

---

## IMPLEMENTATION PHASES & MILESTONES

### PHASE 2: n8n Workflow Automation Integration
* **Objectives**:
  * Build a dedicated asynchronous outbound n8n HTTP client service in the Jarvis backend.
  * Implement webhook endpoints, request/response validation, timeout policies, and exponential retry.
  * Support test (`/webhook-test/...`) and production (`/webhook/...`) URLs.
  * Enable execution ID and asynchronous task tracking.
* **Files to Create / Modify**:
  * `src/openjarvis/services/n8n_service.py` (New core integration service)
  * `src/openjarvis/server/n8n_routes.py` (New API router for n8n status and dispatches)
  * `src/openjarvis/server/app.py` (Mount n8n routes without disrupting existing routes)
  * `tests/test_n8n_service.py` (Unit and mock integration tests)

### PHASE 3: Master AI Agent
* **Objectives**:
  * Implement the central cognitive router (`MasterAgent`).
  * Classify user natural language intent into specialist categories (Meta Ads, Google Ads, SEO, Research, Gmail, Personal Assistant, System).
  * Break complex multi-stage tasks into subtasks.
  * Evaluate security tier (Read-Only vs Approval Required).
  * Route to n8n workflows with fallback to local agent executors.
* **Files to Create / Modify**:
  * `src/openjarvis/agents/master_agent.py` (New Master Router)
  * `src/openjarvis/agents/manager.py` (Integrate with existing agent manager)

### PHASE 4: Specialist AI Agent Workflows
* **Objectives**:
  * Define structured schemas, prompt templates, and execution contracts for:
    1. `JARVIS_02_META_ADS` (Campaign retrieval, 7/14/30-day ROAS/CPA comparison, creative fatigue, read-only guardrails).
    2. `JARVIS_03_GOOGLE_ADS` (Keyword analysis, search terms, wasted spend identification).
    3. `JARVIS_04_SEO` (Website audit, technical SEO, keyword research, meta tag checks).
    4. `JARVIS_05_RESEARCH` (Lead generation, competitor research, structured reports with citations).
    5. `JARVIS_06_GMAIL` (Search, thread summarization, draft generation with strict send approvals).
    6. `JARVIS_07_PERSONAL` (Task organization, scheduling, daily briefs).
  * Include resilient built-in mock/local executors so all agents are fully functional offline before remote n8n webhooks are attached.
* **Files to Create / Modify**:
  * `src/openjarvis/agents/specialists/` (New directory with dedicated specialist handlers)
  * `src/openjarvis/agents/specialists/meta_ads.py`
  * `src/openjarvis/agents/specialists/google_ads.py`
  * `src/openjarvis/agents/specialists/seo.py`
  * `src/openjarvis/agents/specialists/research.py`
  * `src/openjarvis/agents/specialists/gmail.py`
  * `src/openjarvis/agents/specialists/personal.py`

### PHASE 5: Supabase Long-Term Memory System
* **Objectives**:
  * Provide complete PostgreSQL database schema and migration scripts for Supabase.
  * Create tables: `users`, `conversations`, `messages`, `memories`, `agent_tasks`, `agent_executions`, `approvals`, `integrations`, `system_logs`.
  * Implement Row Level Security (RLS) policies and least-privilege key access.
  * Provide backend client with automatic local SQLite fallback when Supabase keys are not yet configured.
* **Files to Create / Modify**:
  * `migrations/supabase/001_initial_schema.sql` (Production-ready SQL migration)
  * `src/openjarvis/services/supabase_service.py` (Dual-mode Supabase/SQLite client)

### PHASE 6: MCP Tool Integration Expansion
* **Objectives**:
  * Expand Model Context Protocol (MCP) tool registry to discover, register, and invoke external automation tools.
  * Standardize tool schemas and validate inputs using Pydantic.
* **Files to Create / Modify**:
  * `src/openjarvis/mcp/tool_registry.py` (Registry expansion)

### PHASE 7: Centralized Human Approval Gateway
* **Objectives**:
  * Classify every action into Read-Only, Low-Risk, or Sensitive/Irreversible.
  * Enforce human confirmation for ad modifications, email sending, file deletion, and external mutations.
  * Unify with frontend `ApprovalBell` and Command Center notification drawer.
* **Files to Create / Modify**:
  * `src/openjarvis/security/approval_gateway.py`

### PHASE 8: Jarvis Command Center Dashboard Integration
* **Objectives**:
  * Connect the existing UI cards (`ACTIVE AGENTS`, `LIVE INTELLIGENCE FEED`, `LLM STATUS`, `SYSTEM MONITOR`, `QUICK COMMANDS`, `VOICE STATUS`) with real-time backend state.
  * Provide a dedicated Agent Management & Task Monitoring view within the HUD.
* **Files to Create / Modify**:
  * `frontend/src/components/CommandCenter/JarvisCommandCenter.tsx`

### PHASE 9 & 10: Security, Testing, and Documentation
* **Objectives**:
  * Comprehensive test suite verifying that no existing chat, voice, or local model functionality has regressed.
  * Maintain `.env.example`, setup guides, and API documentation.
