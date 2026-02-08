# Leamur / Sentinel Demo - Project CLAUDE.md

## Project Overview
Sentinel Demo is a Next.js lease analysis application using a three-agent AI pipeline for PDF lease extraction, validation, and portfolio risk assessment.

## Architecture
- **Framework:** Next.js 16.1.4 (Turbopack)
- **AI Pipeline (3-agent Map-Reduce):**
  1. **Gemini 3 Flash Preview** via Vertex AI (global) — PDF extraction + reasoning, JSON schema constrained
  2. **Claude Opus 4.5** via AWS Bedrock (us-east-1) — Quality validation (non-fatal, retry w/ backoff)
  3. **OpenAI GPT-5.2** via Responses API (`reasoning.effort: low`) — Portfolio synthesis
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
  - `sentinel-demo/src/lib/ai/schema-extraction.ts` — JSON Schema for Gemini constrained decoding
  - `sentinel-demo/src/lib/types-extraction.ts` — includes `ValidationReport`, `LeaseValidation`, `ValidationIssue`

## Environment Variables
- `GOOGLE_GENAI_USE_VERTEXAI=true` — enables Vertex AI mode (Gemini)
- `GOOGLE_CLOUD_PROJECT` — GCP project for Gemini
- `GOOGLE_CLOUD_LOCATION=global` — Vertex AI region (required for Gemini 3 Flash)
- `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json` — GCP service account key
- `AWS_REGION=us-east-1` — AWS region for Bedrock (Claude)
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

### 2026-02-07 — Demo Hardening Session
- **Upgraded Gemini model:** `gemini-2.5-flash-lite` → `gemini-3-flash-preview`
  - 100% first-parse JSON success (was ~50% with Flash Lite)
  - All 4 demo PDFs extract in ~24-34s each, zero retries needed
  - Required changing Vertex AI location from `us-central1` to `global`
- **Added JSON Schema enforcement:** New `schema-extraction.ts` with `EXTRACTION_JSON_SCHEMA`, passed via `responseJsonSchema` config
- **Added JSON repair function:** `repairJson()` in extract-lease route handles truncated JSON (closes unclosed braces/brackets/strings), trailing commas
- **Increased extraction safety:** `maxOutputTokens` 16384→32768, `MAX_ATTEMPTS` 2→3, 3-tier parse (direct → compact → repair)
- **Claude Bedrock retry:** `maxRetries: 3` on SDK + application-level retry with exponential backoff (2s/4s/8s) for 429/5xx
- **GPT synthesis speed:** `reasoning.effort` medium→low, compact JSON input (no pretty-print)
- **Fixed GPT truncation:** `max_output_tokens` was set to 8192 (too small for 4 leases), restored to 16384
- **Fixed frontend filename mismatch:** Replaced batch processing (`Promise.all` with `MAX_CONCURRENT_EXTRACTIONS=5`) with sequential file processing — UI now accurately shows which file is being extracted
- **Fixed potential savings showing zero:** Strengthened synthesis prompt with mandatory calculation formulas (admin fees, break clause value, service charge caps, rent review, turnover rent)
- **Leamur.ai competitive analysis:** Indexed their website via Nia. Their product is obligation management (tracking deadlines, flagging risks). Sentinel fills a gap they don't address: portfolio-level risk analysis, cross-lease variance detection, savings quantification. Complementary, not competing.
- **Full pipeline verified E2E with 4 PDFs:**
  - Extraction (Gemini 3 Flash): 4/4 success, ~24-34s each sequential
  - Validation (Claude Opus 4.5): 33-41s, found 2 minor + 2 major issues
  - Synthesis (GPT-5.2): ~112-118s, 5-6 insights, portfolio risk ~91
- **Demo status:** Functionally ready for screen-recorded demo. Live demo risk is ~4 min total pipeline time.
- **Nia context IDs:**
  - Product description (fact): `51501c75-1600-4328-b425-407fcfe0c6a4`
  - Session context (episodic): `58f6ef95-6ea9-430e-ac8f-f4e280d175fb`
- **Known issues (remaining):**
  - GPT synthesis ~112s (effort:low didn't help much vs medium)
  - No pre-baked fallback cache for demo PDFs
  - No file size guard (22MB+ PDFs can freeze unpdf)
  - Playwright accessibility tests still all fail (pre-existing)

### 2026-02-07 (Session 2) — Cloud Run Deployment Setup (Partial)
- **Added `output: 'standalone'`** to `next.config.ts` — required for containerized Next.js
- **Created `Dockerfile`** — multi-stage build (deps → build → runtime) with `node:22-alpine`, runs as non-root `nextjs` user
- **Created `.dockerignore`** — excludes node_modules, .next, .env*, service-account*.json, test artifacts
- **Build verified locally** — standalone output generates correctly, all routes compile
- **Deployment blocked on GCP auth:** `gcloud auth login` fails with `redirect_uri` / `invalid_request` OAuth error on this machine. Tried: `--no-launch-browser`, `--no-browser`, `gcloud init`, `application-default login` — all hit same OAuth redirect issue. Service account can't enable APIs (circular: needs Service Usage API which is also disabled).
- **Recommended next step:** Use **Google Cloud Shell** (browser-based terminal at console.cloud.google.com) to:
  1. Enable APIs: Cloud Run, Cloud Build, Artifact Registry
  2. Deploy with: `gcloud run deploy sentinel-demo --source . --project gen-lang-client-0754692302 --region us-central1 --timeout=600 --memory=1Gi --allow-unauthenticated`
  3. Set env vars via `--set-env-vars` (AWS keys, OpenAI key, Vertex AI config)
- **Alternative:** Fix local gcloud by reinstalling (`brew reinstall google-cloud-sdk`) or updating (`gcloud components update`)
- **Files created/modified:** `sentinel-demo/next.config.ts`, `sentinel-demo/Dockerfile`, `sentinel-demo/.dockerignore`

### 2026-02-08 — Cloud Run Deployment Complete
- **Created `deploy-cloudrun.sh`:** 7-phase deployment script for Cloud Shell (validate prereqs, enable APIs, IAM, clone repo, collect secrets, deploy, verify)
- **Cloud Run settings:** `us-central1`, 600s timeout, 1Gi memory, 1 CPU, 0-3 instances, unauthenticated
- **Fixed `.env.example`:** `GOOGLE_CLOUD_LOCATION` → `global`, `AWS_REGION` → `us-east-1`, commented out `GOOGLE_APPLICATION_CREDENTIALS` (local-dev only), added AWS key placeholders
- **Fixed `.gitignore`:** Added `!.env.example` exception so the file is tracked
- **Deployed successfully via Cloud Shell:** App is live on Cloud Run
- **Service URL:** Check with `gcloud run services describe sentinel-demo --region us-central1 --format="value(status.url)"`
- **Redeploy command (from Cloud Shell):** `cd ~/leamur/sentinel-demo && git pull && gcloud run deploy sentinel-demo --source . --region us-central1 --quiet`

### Next Session Priorities
- **Priority 1 — Pre-bake cache:** Serve instant cached results for known demo PDFs with simulated loading
- **Priority 2 — File size guard:** Reject PDFs >5MB before unpdf processing
- **Priority 3 — GPT speed:** Investigate streaming or switching to a faster model for synthesis
- **Priority 4 — Custom domain:** Map a domain to the Cloud Run service if needed for demo
