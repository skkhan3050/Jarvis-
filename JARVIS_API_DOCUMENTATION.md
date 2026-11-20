# Jarvis Personal AI Operating System — API Documentation

This document describes all REST and WebSocket API endpoints available in the Jarvis Personal AI Operating System (v3.0.0).

---

## 1. Master Agent & Orchestration

### `POST /v1/master/dispatch`
Dispatches a user request to the Master AI Agent, which categorizes intent, checks security tiers, and routes to either an n8n webhook workflow or the appropriate specialist agent.

**Request:**
```json
{
  "message": "Analyze my Meta Ads campaigns",
  "conversation_id": "conv_9238472",
  "user_id": "commander",
  "prefer_n8n": false
}
```

**Response:**
```json
{
  "handled": true,
  "task_id": "task_48f92b71",
  "category": "meta_ads",
  "agent": "JARVIS_02_META_ADS",
  "status": "completed",
  "summary": "**Meta Ads Audit Report**\n\n• Blended ROAS: 3.42x...",
  "metrics": {
    "spend_7d": 1840.50,
    "revenue_7d": 6294.00,
    "roas": 3.42
  }
}
```

### `GET /v1/master/specialists`
Returns the status, capabilities, and approval requirements for all 6 registered specialist agents.

### `GET /v1/master/status`
Returns real-time telemetry across AI Core, n8n connection, Supabase connection, and pending approvals.

---

## 2. n8n Automation Workflows

### `GET /v1/n8n/health`
Checks outbound HTTPS connectivity to the configured cloud n8n instance.

### `POST /v1/n8n/chat`
Sends an authenticated outbound webhook payload to `jarvis-chat`.

**Request:**
```json
{
  "message": "Scale Meta Ads budget by 15%",
  "conversation_id": "conv-1234",
  "user_id": "commander",
  "source": "jarvis_command_center"
}
```

### `GET /v1/n8n/tasks/{task_id}`
Polls status of long-running asynchronous workflows triggered in n8n.

---

## 3. Human Approval Gateway

### `GET /v1/approvals/pending`
Lists all pending high-risk actions requiring explicit human sign-off (e.g. ad budget updates, live email sends).

### `POST /v1/approvals/{action_id}/approve`
Authorizes execution of a pending sensitive action.

### `POST /v1/approvals/{action_id}/deny`
Rejects execution of a pending sensitive action.

---

## 4. Chat & Completions

### `POST /v1/chat/completions`
OpenAI-compatible chat completion endpoint supporting local Ollama (`qwen:7b`), Gemini, Anthropic, and streaming responses with memory context injection.

### `WS /v1/chat/stream`
Full-duplex WebSocket stream for real-time tokens and tool events.

---

## 5. Voice & Multilingual (Bengali, Hindi, English)

### `POST /v1/speech/synthesize`
Synthesizes speech using ElevenLabs or local TTS with language tags (`bn-IN`, `hi-IN`, `en-US`).

### `POST /v1/speech/transcribe`
Transcribes incoming audio streams using Whisper or browser STT.
