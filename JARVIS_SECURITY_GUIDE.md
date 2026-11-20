# Jarvis Personal AI Operating System — Security & Approval Guide

Security is a foundational pillar of the Jarvis Operating System architecture. This document outlines the defense-in-depth controls, Human Approval Gateway policies, and safe network isolation standards.

---

## 1. Zero-Inbound Windows Network Model

- **Local Jarvis runs strictly locally** on `127.0.0.1:8000`.
- **No router port forwarding** and **no public port exposure** is required or permitted.
- **Outbound-Only HTTPS:** Communication to cloud services (e.g. cloud n8n instances, Supabase, Meta Graph API, Google Ads API) is strictly outbound over TLS 1.3 with Bearer token authentication.
- **Asynchronous Workflows:** Long-running cloud executions return task tokens that Jarvis polls asynchronously over outbound requests.

---

## 2. Centralized Human Approval Gateway

Jarvis implements strict action risk tiers (`src/openjarvis/security/approval_gateway.py`):

| Risk Tier | Examples | Execution Policy |
| :--- | :--- | :--- |
| **TRIVIAL / LOW** | Ad campaign reads, SEO audits, competitor research, email triage, draft creation | Auto-approved |
| **MEDIUM** | Pausing ad campaigns, adding negative keywords | Gated — requires approval |
| **HIGH** | Updating ad budgets, modifying CPA bids, sending live emails via Gmail | Gated — **Mandatory operator sign-off** |
| **CRITICAL** | Deleting databases, destroying files, credentials access | Gated — **Mandatory sign-off with audit log** |

### Approval Flow:
1. When a user requests a high-risk action (e.g., *"Scale my Meta Ads budget to $5,000"*), the Specialist Agent suspends execution and generates a unique `action_id`.
2. A `PendingAction` record is stored in the Approval Store and logged in Supabase.
3. The UI alerts the operator with action details, payload, and the `Approve` / `Deny` buttons.
4. The action executes **only** when `/v1/approvals/{id}/approve` is authorized by the operator.

---

## 3. Secret Management & Data Boundary

- **No Secrets in Frontend:** API keys, service role keys, and passwords must never be returned to the browser or embedded in client bundles.
- **Environment Separation:** Production variables are kept in `.env` or the encrypted local vault `~/.openjarvis/cloud-keys.env`.
- **Taint Tracking & Data Boundary Audits:** Outgoing tool payloads are scrubbed of credentials and personal identifiers before transmission.
