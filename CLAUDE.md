# Leamur / Sentinel Demo - Project CLAUDE.md

## Project Overview
Sentinel Demo is a Next.js lease analysis application using a three-agent AI pipeline for PDF lease extraction, validation, and portfolio risk assessment.

## Architecture
- **Framework:** Next.js 16.1.4 (Turbopack)
- **AI Pipeline (3-agent Map-Reduce):**
  1. **Gemini 2.5 Flash Lite** via Vertex AI — PDF extraction, clause retrieval
  2. **Claude Opus 4.5** via AWS Bedrock — Quality validation (non-fatal fallback if unavailable)
  3. **OpenAI GPT-5.2** via Responses API (`reasoning.effort: xhigh`) — Portfolio synthesis
- **Authentication:**
  - GCP: Service account key file (`service-account.json`) for Vertex AI (Gemini)
  - AWS: Standard credential chain (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) for Bedrock (Claude)
  - OpenAI: API key
- **Key files:**
  - `sentinel-demo/src/lib/ai/gemini-client.ts` — shared Gemini client factory + `GEMINI_MODEL` constant
  - `sentinel-demo/src/lib/ai/claude-client.ts` — AnthropicBedrock client factory
  - `sentinel-demo/src/lib/ai/claude.ts` — `validateExtractions()` with `applyCorrections()`
  - `sentinel-demo/src/lib/ai/prompts-validation.ts` — Claude validation prompts (5-check auditor)
  - `sentinel-demo/src/app/api/validate-extractions/route.ts` — validation endpoint (graceful fallback)
  - `sentinel-demo/src/app/api/synthesize-portfolio/route.ts` — synthesis via OpenAI Responses API
  - `sentinel-demo/src/lib/types-extraction.ts` — includes `ValidationReport`, `LeaseValidation`, `ValidationIssue`

## Environment Variables
- `GOOGLE_GENAI_USE_VERTEXAI=true` — enables Vertex AI mode (Gemini)
- `GOOGLE_CLOUD_PROJECT` — GCP project for Gemini
- `GOOGLE_CLOUD_LOCATION=us-central1` — Vertex AI region
- `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json` — GCP service account key
- `AWS_REGION=us-west-2` — AWS region for Bedrock (Claude)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — AWS credentials for Bedrock
- `OPENAI_API_KEY` — for GPT-5.2 synthesis
- `AI_MODE` — `mock` or `live`

## Session Handoff Notes

### 2026-02-06 (Session 2) — Three-Agent Architecture + Model Changes
- **Added Claude Opus 4.5 as quality auditor** (Agent 2 in pipeline): Validates Gemini extractions before GPT synthesis
  - Initially built for GCP Vertex AI, **pivoted to AWS Bedrock** (user lacks GCP Opus access)
  - SDK: `@anthropic-ai/bedrock-sdk`, model: `us.anthropic.claude-opus-4-5-20251101-v1:0`
  - Non-fatal: pipeline continues with unvalidated extractions if Claude is unavailable
- **Switched Gemini from `gemini-2.5-flash` to `gemini-2.5-flash-lite`**: Centralized `GEMINI_MODEL` constant in `gemini-client.ts`, all 4 consumers updated
- **Switched OpenAI from Chat Completions API to Responses API**: `openai.responses.create()` with `reasoning.effort: 'xhigh'` and `json_object` format
- **Fixed GPT model**: `gpt-5.2-pro` (404 — not a chat model) → `gpt-5.2`
- **Fixed API route bug**: `validate-extractions/route.ts` catch block tried `request.clone().json()` after body already consumed — refactored to hoist body parsing
- **New files:** `claude-client.ts`, `claude.ts`, `prompts-validation.ts`, `validate-extractions/route.ts`
- **UI:** Added 3-phase loading indicator (Extracting → Validating → Synthesizing) with `ShieldCheck` icon
- **Types:** Added `ValidationReport`, `LeaseValidation`, `ValidationIssue`, `'validating'` phase
- **State machine:** Added `VALIDATION_STARTED` / `VALIDATION_COMPLETE` actions to reducer
- **Verified:** Build passes, extraction works with small PDFs (~65KB). Large PDFs (22MB) cause `unpdf` to block the event loop.
- **Not yet verified:** Full 3-agent pipeline end-to-end (Claude 429'd on Vertex, needs AWS credentials configured)
- **Known issues:**
  - Large PDF extraction (22MB+) blocks Node.js event loop via `unpdf` — needs worker thread or size limit
  - Playwright accessibility tests still all fail (pre-existing, unrelated)
  - AWS credentials not yet added to `.env.local` for Bedrock

### 2026-02-06 (Session 3) — AWS Credentials & Full Pipeline E2E Verified
- **Configured AWS Bedrock credentials** in `.env.local`: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, region changed from `us-west-2` to `us-east-1`
- **Full 3-agent pipeline verified end-to-end:**
  - Extraction (Gemini Flash Lite): 3 PDFs extracted successfully (~10-12s each)
  - Validation (Claude Opus 4.5 via Bedrock): Real validation in ~38-42s, found issues in all 3 leases (2 minor, 1 major)
  - Synthesis (GPT-5.2 via Responses API): Portfolio analysis in ~173s, risk score 78.58, 6 insights
- **Fixed Gemini JSON parsing** (`extract-lease/route.ts`):
  - Added markdown code fence stripping
  - Added compacted JSON fallback for literal newlines in string values
  - Added retry mechanism (2 attempts) for intermittent malformed JSON
  - Increased `maxOutputTokens` from 8192 to 16384
  - Lowered `temperature` from 0.2 to 0.1 for more consistent output
- **Fixed Claude JSON parsing** (`claude.ts`): Strip markdown code fences before `JSON.parse`
- **Fixed GPT-5.2 synthesis** (`synthesize-portfolio/route.ts`):
  - Removed unsupported `temperature` parameter (not supported with Responses API for this model)
  - Changed `reasoning.effort` from `xhigh` to `medium` (xhigh caused empty responses and 4+ min timeouts)
  - Added response structure logging for debugging
- **Known issues (remaining):**
  - Large PDF extraction (22MB+) blocks Node.js event loop via `unpdf` — needs worker thread or size limit
  - Playwright accessibility tests still all fail (pre-existing, unrelated)
  - Gemini JSON output is non-deterministic; ~50% of responses need compacted fallback parse

### 2026-02-06 (Session 1) — Vertex AI Migration
- **Completed:** Migrated from `GEMINI_API_KEY` direct auth to Vertex AI with service account
- **Created:** `gemini-client.ts` shared client factory supporting both Vertex AI and API key fallback
- **Updated:** All 3 Gemini consumers to use shared client (gemini.ts, gemini-portfolio.ts, extract-lease/route.ts)
- **GCP:** Vertex AI API enabled on project `gen-lang-client-0754692302`
- **Service account key:** `service-account.json` in project root, gitignored

### 2026-02-07 — Next Session: Demo Readiness (CEO Pitch)
- **Goal:** Get Sentinel to CEO-pitch quality
- **Priority 1 — Pre-bake fallback:** Cache known-good pipeline results; serve cached output if live calls fail or timeout
- **Priority 2 — Harden Gemini JSON parsing:** ~50% failure rate on first parse is unacceptable for live demo; investigate stricter prompts, structured output mode, better post-processing
- **Priority 3 — File size guard:** Reject PDFs over ~5MB with clear message; prevents event loop freeze from `unpdf` on large files
- **Priority 4 — Reduce GPT synthesis time:** Currently ~173s; lower `reasoning.effort`, pre-compute for demo PDFs, or add streaming; target <60s
- **Nia context ID:** `58f6ef95-6ea9-430e-ac8f-f4e280d175fb`
