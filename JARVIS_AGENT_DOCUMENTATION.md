# Jarvis Multi-Agent Operating System — Agent Documentation

This document specifies the architecture, roles, capabilities, and governance policies for all agents in the Jarvis Personal AI Operating System.

---

## 1. AI Master Agent (`JARVIS_01_MASTER`)
- **File:** `src/openjarvis/agents/master_agent.py`
- **Role:** Central Orchestrator & Intent Classifier
- **Responsibilities:**
  1. Analyzes user messages across natural language.
  2. Determines task domain (Advertising, SEO, Research, Email, Personal, or General Chat).
  3. Checks if an n8n webhook workflow should execute or dispatches to the local Specialist Agent.
  4. Enforces Human Approval Gateway for high-risk actions.
  5. Records task state and outputs into Supabase Long-Term Memory.

---

## 2. Meta Ads Specialist (`JARVIS_02_META_ADS`)
- **File:** `src/openjarvis/agents/specialists/meta_ads.py`
- **Role:** Performance & ROAS Auditor for Meta (Facebook & Instagram)
- **Tool Capabilities:**
  - `meta_ads_read_insights` (Tier: TRIVIAL - Auto-Approved)
  - `meta_ads_audit_creatives` (Tier: TRIVIAL - Auto-Approved)
  - `meta_ads_update_budget` (Tier: HIGH - **Requires Approval**)
  - `meta_ads_pause_campaign` (Tier: MEDIUM - **Requires Approval**)
- **Fallback Mode:** High-fidelity simulated audit report when Meta API token is offline.

---

## 3. Google Ads Specialist (`JARVIS_03_GOOGLE_ADS`)
- **File:** `src/openjarvis/agents/specialists/google_ads.py`
- **Role:** Search & Performance Max PPC Auditor
- **Tool Capabilities:**
  - `google_ads_report` (Tier: TRIVIAL - Auto-Approved)
  - `google_ads_negative_keywords` (Tier: MEDIUM - **Requires Approval**)
  - `google_ads_update_cpa` (Tier: HIGH - **Requires Approval**)
- **Key Output:** Wasted spend identification, non-converting search term flags, CPA tuning.

---

## 4. Technical SEO Specialist (`JARVIS_04_SEO`)
- **File:** `src/openjarvis/agents/specialists/seo.py`
- **Role:** Organic Search, Core Web Vitals & Keyword Strategist
- **Tool Capabilities:**
  - `seo_audit` (Tier: TRIVIAL - Autonomous)
  - `seo_keyword_research` (Tier: TRIVIAL - Autonomous)
- **Key Output:** Crawl health score, missing meta tags, high-intent keyword ranking targets.

---

## 5. Deep Research Specialist (`JARVIS_05_RESEARCH`)
- **File:** `src/openjarvis/agents/specialists/research.py`
- **Role:** Market Intelligence & Competitor Benchmarking
- **Tool Capabilities:**
  - Live Tavily search integration (when `TAVILY_API_KEY` is present).
  - Autonomous multi-source strategic dossier synthesis fallback.

---

## 6. Executive Gmail Specialist (`JARVIS_06_GMAIL`)
- **File:** `src/openjarvis/agents/specialists/gmail.py`
- **Role:** Inbox Triage, Summaries & Communications
- **Tool Capabilities:**
  - `gmail_read_inbox` (Tier: TRIVIAL - Auto-Approved)
  - `gmail_create_draft` (Tier: LOW - Auto-Approved)
  - `gmail_send_message` (Tier: HIGH - **Requires Approval**)
  - `gmail_delete_message` (Tier: HIGH - **Requires Approval**)

---

## 7. Personal Assistant Specialist (`JARVIS_07_PERSONAL`)
- **File:** `src/openjarvis/agents/specialists/personal.py`
- **Role:** Daily Agenda, Task Prioritization & Executive Briefing
- **Tool Capabilities:**
  - Agenda time-blocking, standup synthesis, weather & vital system status summaries.
