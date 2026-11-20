# JARVIS – PERSONAL AI OPERATING SYSTEM
## ARCHITECTURE AUDIT & SYSTEM SPECIFICATION (PHASE 1)

**Document Version:** 1.0.0  
**Date:** November 18, 2026  
**Author:** Senior AI Systems Architect & Engineering Team  
**Project Name:** Jarvis  
**Repository Path:** `c:\Users\TARIF SK\Downloads\OpenJarvis-main (1)\OpenJarvis-main`  
**Workspace Path:** `c:\Users\TARIF SK\OneDrive\문서\Jervis Perctional Acistent`

---

## 1. EXECUTIVE SUMMARY

The Jarvis project is transitioning from a modular on-device assistant into a distributed, multi-agent **Personal AI Operating System**. The current foundation is built on an enterprise-grade Python 3.12 FastAPI backend and a cutting-edge React 19 / Vite 8 frontend featuring a futuristic **JARVIS Command Center HUD** and holographic voice agent interface.

This audit establishes the baseline of all existing components, documents the preservation parameters, identifies gaps relative to the Master Project requirements, and formulates the exact phase-by-phase implementation plan.

---

## 2. EXISTING ARCHITECTURE & TECHNOLOGY STACK

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                            │
│  React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Zustand 5          │
│  • JARVIS Command Center HUD (Photo 1 Widescreen Sci-Fi Design)        │
│  • Holographic Voice Agent (Real-time Lip-Sync, Waveforms, Multilingual)│
│  • Classic Chat Area (Markdown, KaTeX, Tool Calling Cards)             │
│  • Real-time WebSockets & SSE Streaming (/v1/chat/completions)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / WebSocket (Port 8000)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       BACKEND SERVER LAYER                             │
│  Python 3.12 + FastAPI 0.163 + Uvicorn (ASGI)                          │
│  • Unified Server: Serves REST/WS APIs & compiled static SPA           │
│  • Core Pillars: Intelligence, Agents, Tools & MCP, Engine, Learning   │
│  • Auth Middleware (Bearer Token / API Keys)                           │
│  • Security Gates & Human Approval (/v1/approvals)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   AI ENGINE   │           │    STORAGE    │           │    SPEECH     │
│  Multi-Engine │           │ • SQLite DB   │           │ • Web Speech  │
│  • Gemini API │           │ • FactStore   │           │ • ElevenLabs  │
│  • Ollama     │           │ • FAISS/BM25  │           │ • FasterWhisp.│
│  • OpenAI/NIM │           │ • Supabase    │           │ • Multi-lang  │
└───────────────┘           └───────────────┘           └───────────────┘
```

### Detailed Tech Stack:
* **Frontend**: React 19.3.1, Vite 8.3.6, TypeScript 7.0.2, Tailwind CSS 4.3.3, Zustand 5.1.0, Lucide React, Framer Motion (motion 13.4.4), KaTeX 0.19.1, Sonner, Recharts 3.10.1.
* **Backend**: Python 3.12.13, FastAPI 0.163.1, Starlette 1.10.0, Pydantic 2.14.3, Uvicorn 0.54.0, Click 8.5.1, Httpx 0.28.1, Requests 2.34.2.
* **Inference Engines**: OpenJarvis Engine Layer supporting Google Gemini (`gemini-2.5-pro`, `gemini-3-flash`), Ollama local models (`qwen:7b`), OpenAI (`gpt-4o`), and NVIDIA NIM / LiteLLM.
* **Speech & Audio**: Web Speech API (transcription & multilingual synthesis), ElevenLabs API integration, Faster-Whisper local engine support, reactive audio visualizer and SVG lip-sync mouth mesh.
* **Tools & MCP**: Model Context Protocol (MCP) tool adapter, Tavily Web Search, Python REPL, DuckDuckGo search, file system operations, weather, system shell executor.
* **Security & Guardrails**: Human approval system (`approval_routes.py`, `ApprovalBell.tsx`), capability policies, rate limiting, credential masking.

---

## 3. INVENTORY OF EXISTING WORKING FEATURES

| Feature Area | Implementation Status | Key Components / Files |
|---|---|---|
| **Command Center HUD** | Operational | `frontend/src/components/CommandCenter/JarvisCommandCenter.tsx` |
| **Holographic Voice Agent** | Operational | `frontend/src/components/Hologram/HologramVoiceAgent.tsx` |
| **Multilingual Voice/Text** | Operational | Bengali (`bn-IN`), Hindi (`hi-IN`), English (`en-US`) |
| **AI Chat & Streaming** | Operational | `src/openjarvis/server/routes.py` (`/v1/chat/completions`) |
| **Local Model Runtime** | Operational | Ollama (`qwen:7b`) on `http://localhost:11434` |
| **Cloud Model Runtime** | Operational | Google Gemini & OpenAI via `src/openjarvis/engine/cloud.py` |
| **Web Search Integration** | Operational | Tavily Search (`src/openjarvis/tools/web_search.py`) |
| **Human Approvals** | Operational | `src/openjarvis/server/approval_routes.py` |
| **Fact Memory Service** | Operational | `src/openjarvis/memory/service.py` & `store.py` |
| **Static Web Serving** | Operational | Single-port FastAPI delivery (`/static`) on `http://127.0.0.1:8000` |

---

## 4. MISSING COMPONENTS (GAPS TO BRIDGE)

1. **Dedicated n8n Workflow Service**:
   * Need an outbound HTTPS service (`n8n_service.py`) capable of dispatching structured payloads to n8n webhook paths (e.g. `/webhook/jarvis-chat`), with authentication headers, retry policies, and timeout handling.
   * Asynchronous task execution tracking and webhook response parsing.
2. **Specialist Agents Architecture**:
   * Master AI Agent needs specialized dispatch schemas for:
     * `JARVIS_02_META_ADS`
     * `JARVIS_03_GOOGLE_ADS`
     * `JARVIS_04_SEO`
     * `JARVIS_05_RESEARCH`
     * `JARVIS_06_GMAIL`
     * `JARVIS_07_PERSONAL`
   * Need local fallback mock executors so the system functions gracefully even when external n8n workflows are in development or offline.
3. **Enterprise Supabase PostgreSQL Schema & Migration**:
   * Dedicated backend Supabase service for PostgreSQL tables: `users`, `conversations`, `messages`, `memories`, `agent_tasks`, `agent_executions`, `approvals`, `integrations`, `system_logs`.
   * Row Level Security (RLS) policies and least-privilege key segregation (service-role on backend only, anon key on frontend).
4. **Enhanced Approval & Monitoring in HUD**:
   * Direct visual execution of pending approvals and specialist agent task status inside the Jarvis Command Center.

---

## 5. COMPATIBILITY & SECURITY AUDIT

* **Local vs Cloud Networking**: Jarvis runs locally on Windows. Cloud n8n instances (e.g. Bluehost VPS, Hetzner, or n8n Cloud) cannot reach Windows `localhost` directly.
  * **Solution**: Local Jarvis initiates *outbound HTTPS requests* to n8n webhooks. For asynchronous multi-step jobs, Jarvis polls or uses n8n execution IDs rather than keeping indefinite hanging connections.
* **Sensitive Credentials**: API keys (`GEMINI_API_KEY`, `TAVILY_API_KEY`, `ELEVENLABS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `N8N_WEBHOOK_AUTH`) must stay in backend `.env` / `credentials.toml` and never be leaked into client bundles or git logs.
* **Execution Safety**: All sensitive operations (ad spend changes, campaign modification, email transmission, file deletion) are routed through the Human Approval gate.

---

## 6. REQUIRED ENVIRONMENT VARIABLES & CONFIGURATION

The following configuration schema is supported via `.env` and `~/.openjarvis/cloud-keys.env`:

```env
# --- AI Providers ---
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# --- Web Search & Tools ---
TAVILY_API_KEY=your_tavily_api_key

# --- Voice & Speech ---
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb

# --- n8n Workflow Automation ---
JARVIS_N8N_BASE_URL=https://your-n8n-instance.com
JARVIS_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/jarvis-chat
JARVIS_N8N_WEBHOOK_TEST_URL=https://your-n8n-instance.com/webhook-test/jarvis-chat
JARVIS_N8N_AUTH_HEADER=X-Jarvis-Key
JARVIS_N8N_AUTH_VALUE=your_secure_n8n_token

# --- Supabase Long-Term Memory ---
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

## 7. RECOMMENDED IMPLEMENTATION ORDER

* **PHASE 1 (Complete)**: Architecture Audit (`JARVIS_ARCHITECTURE_AUDIT.md`) and Implementation Plan (`JARVIS_IMPLEMENTATION_PLAN.md`).
* **PHASE 2**: n8n Integration Service (`src/openjarvis/services/n8n_service.py`), Pydantic models, and `/v1/n8n` FastAPI routes.
* **PHASE 3**: Master AI Agent routing layer (`src/openjarvis/agents/master_agent.py`) with intent classification and agent delegation.
* **PHASE 4**: Specialist Agent Workflow definitions (Meta Ads, Google Ads, SEO, Research, Gmail, Personal Assistant) with local resilient fallbacks.
* **PHASE 5**: Supabase Memory Service (`src/openjarvis/services/supabase_service.py`) and PostgreSQL migrations.
* **PHASE 6**: MCP Tool Integration Expansion.
* **PHASE 7**: Human Approval Gateway & Audit Logging.
* **PHASE 8**: Jarvis Command Center Dashboard Integration.
* **PHASE 9**: Error Handling, Monitoring, and Comprehensive Integration Verification.
