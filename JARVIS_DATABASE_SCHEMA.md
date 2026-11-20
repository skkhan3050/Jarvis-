# Jarvis Personal AI Operating System — Database Schema Documentation

This document describes the PostgreSQL/Supabase database schema and the local SQLite dual-mode fallback schema implemented for Jarvis.

---

## 1. Schema Overview

The database migration is located at:
- `migrations/supabase/001_initial_schema.sql`

It establishes 9 core tables with Row-Level Security (RLS) enabled, indexed foreign keys, and vector search readiness:

```
[ users ]
   │
   ├──────< [ conversations ] ──────< [ messages ]
   │
   ├──────< [ memories ]
   │
   └──────< [ agent_tasks ] ──────< [ agent_executions ]
                 │
                 └──────< [ approvals ]

[ integrations ]
[ system_logs ]
```

---

## 2. Table Specifications

### 2.1 `users`
- `id`: `UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `email`: `TEXT UNIQUE`
- `full_name`: `TEXT`
- `role`: `TEXT NOT NULL DEFAULT 'user'`
- `metadata`: `JSONB DEFAULT '{}'::jsonb`
- `created_at`, `updated_at`: `TIMESTAMPTZ`

### 2.2 `conversations`
- `id`: `UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `user_id`: `UUID REFERENCES users(id) ON DELETE CASCADE`
- `title`: `TEXT NOT NULL DEFAULT 'New Session'`
- `source`: `TEXT NOT NULL DEFAULT 'web_hud'`
- `status`: `TEXT NOT NULL DEFAULT 'active'`
- `metadata`: `JSONB`

### 2.3 `messages`
- `id`: `UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `conversation_id`: `UUID REFERENCES conversations(id) ON DELETE CASCADE`
- `role`: `TEXT CHECK (role IN ('user', 'assistant', 'system', 'tool'))`
- `content`: `TEXT NOT NULL`
- `agent_name`: `TEXT DEFAULT 'Jarvis'`
- `metadata`: `JSONB`

### 2.4 `memories`
- `id`: `UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `user_id`: `UUID REFERENCES users(id) ON DELETE CASCADE`
- `category`: `TEXT NOT NULL DEFAULT 'general'`
- `content`: `TEXT NOT NULL`
- `importance`: `INT NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5)`
- `embedding`: `JSONB / vector(1536)`
- `metadata`: `JSONB`

### 2.5 `agent_tasks`
- `id`: `UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `task_id`: `TEXT UNIQUE NOT NULL`
- `agent_name`: `TEXT NOT NULL`
- `category`: `TEXT NOT NULL`
- `status`: `CHECK (status IN ('pending', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled'))`
- `requires_approval`: `BOOLEAN DEFAULT FALSE`
- `input_payload`, `output_payload`: `JSONB`
- `error_message`: `TEXT`

### 2.6 `agent_executions`
- `id`: `UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `task_id`: `UUID REFERENCES agent_tasks(id) ON DELETE CASCADE`
- `execution_id`: `TEXT UNIQUE NOT NULL`
- `n8n_execution_id`: `TEXT`
- `status`: `CHECK (status IN ('started', 'running', 'completed', 'failed', 'retrying'))`
- `logs`: `JSONB`
- `metrics`: `JSONB`

### 2.7 `approvals`
- `id`: `UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `task_id`: `UUID REFERENCES agent_tasks(id) ON DELETE CASCADE`
- `action_type`: `TEXT NOT NULL`
- `description`: `TEXT NOT NULL`
- `payload`: `JSONB NOT NULL`
- `risk_level`: `CHECK (risk_level IN ('trivial', 'low', 'medium', 'high', 'critical'))`
- `status`: `CHECK (status IN ('pending', 'approved', 'denied', 'expired'))`
- `requested_by`, `decided_by`: `TEXT`

### 2.8 `integrations`
- `id`: `UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `platform`: `TEXT UNIQUE NOT NULL` (e.g. 'n8n', 'meta_ads', 'google_ads', 'gmail')
- `status`: `CHECK (status IN ('connected', 'disconnected', 'error', 'pending_auth'))`
- `config`: `JSONB`
- `credentials_vault_ref`: `TEXT`

### 2.9 `system_logs`
- `id`: `UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `level`: `CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'))`
- `component`: `TEXT NOT NULL`
- `message`: `TEXT NOT NULL`
- `metadata`: `JSONB`

---

## 3. Dual-Mode Local SQLite Fallback

When `SUPABASE_URL` is omitted or network connectivity is interrupted, `SupabaseMemoryService` automatically activates:
`~/.openjarvis/jarvis_supabase_fallback.db`
This guarantees continuous local operation, zero request drops, and instant recovery.
