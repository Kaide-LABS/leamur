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

### 2026-02-06 (Session 1) — Vertex AI Migration
- **Completed:** Migrated from `GEMINI_API_KEY` direct auth to Vertex AI with service account
- **Created:** `gemini-client.ts` shared client factory supporting both Vertex AI and API key fallback
- **Updated:** All 3 Gemini consumers to use shared client (gemini.ts, gemini-portfolio.ts, extract-lease/route.ts)
- **GCP:** Vertex AI API enabled on project `gen-lang-client-0754692302`
- **Service account key:** `service-account.json` in project root, gitignored
