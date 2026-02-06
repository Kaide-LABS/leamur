# Leamur / Sentinel Demo - Project CLAUDE.md

## Project Overview
Sentinel Demo is a Next.js lease analysis application that uses Gemini AI (via Vertex AI) and OpenAI GPT-5.2 Pro for PDF lease extraction, clause analysis, and portfolio risk assessment.

## Architecture
- **Framework:** Next.js 16.1.4 (Turbopack)
- **AI Providers:**
  - Google Gemini 2.5 Flash via Vertex AI (extraction, clause retrieval, portfolio analysis)
  - OpenAI GPT-5.2 Pro (synthesis)
- **Authentication:** Service account key file (`service-account.json`) for Vertex AI
- **Key files:**
  - `sentinel-demo/src/lib/ai/gemini-client.ts` — shared Gemini client factory (Vertex AI + API key fallback)
  - `sentinel-demo/src/lib/ai/gemini.ts` — clause retrieval
  - `sentinel-demo/src/lib/ai/gemini-portfolio.ts` — portfolio analysis
  - `sentinel-demo/src/app/api/extract-lease/route.ts` — lease PDF extraction endpoint

## Environment Variables
- `GOOGLE_GENAI_USE_VERTEXAI=true` — enables Vertex AI mode
- `GOOGLE_CLOUD_PROJECT=gen-lang-client-0754692302` — GCP project
- `GOOGLE_CLOUD_LOCATION=us-central1` — Vertex AI region
- `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json` — service account key
- `OPENAI_API_KEY` — for GPT-5.2 Pro synthesis
- `AI_MODE` — `mock` or `live`

## Session Handoff Notes

### 2026-02-06 — Vertex AI Migration
- **Completed:** Migrated from `GEMINI_API_KEY` direct auth to Vertex AI with service account
- **Created:** `gemini-client.ts` shared client factory supporting both Vertex AI and API key fallback
- **Updated:** All 3 Gemini consumers to use shared client (gemini.ts, gemini-portfolio.ts, extract-lease/route.ts)
- **GCP:** Vertex AI API enabled on project `gen-lang-client-0754692302`
- **Service account key:** `service-account.json` in project root, gitignored
- **Not yet verified:** Live API call end-to-end (test was interrupted). Need to test with `AI_MODE=live` by uploading a PDF through the UI.
- **Pre-existing issue:** Playwright accessibility tests all fail (timeout waiting for UI selector). Not related to this migration.
