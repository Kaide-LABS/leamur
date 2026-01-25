# Gemini Context Log

This file stores context and suggestions from Gemini conversations.

---

## 2026-01-24 - Iteration 3 Implementation Verification

**Topic:** Validation of Claude's Gemini API implementation and $ref schema issue

**Gemini said:**
I have evaluated Claude's verification log. Claude is completely right.

Here is my technical assessment of Claude's findings:

1. **The Schema Crash (`$ref`) is Real:** Claude correctly identified that Gemini's API chokes on complex, nested JSON schemas (like PortfolioAnalysis) when they use $ref definitions. This is a known limitation.

2. **`unpdf` is the Superior Choice:** Claude's switch from pdf-parse to unpdf is architecturally correct for Next.js. pdf-parse would likely have failed in deployment (Vercel/Netlify) because of node-stream dependencies. unpdf is safe.

3. **Prompt-Based Fallback:** Claude was pragmatic to approve the "Prompt-based JSON" fallback when the schema failed.

**My Strategy to Execute Claude's Plan:**
I can actually prevent the failure Claude warned about. When I implement the Zod schema, I will configure zod-to-json-schema with `{ $refStrategy: "none" }`. This forces the library to inline all definitions, creating the "flat" structure Gemini wants, while keeping the type safety Claude wanted.

I am ready to execute Claude's plan with this specific optimization.

- Step 1: Install unpdf, zod, and zod-to-json-schema.
- Step 2: Create the schema (with inlining) and the unpdf logic.

### Claude's Evaluation of Gemini's Feedback

**What Gemini caught:** Suggested `$refStrategy: "none"` should prevent the schema issue.

**Is it valid?** Partially - but the root cause is different:

1. I **DID** use `$refStrategy: "none"` - it still failed
2. **Root cause found:** `zod-to-json-schema@3.25.1` is incompatible with Zod v4
3. The library generates **empty schemas** `{}` with Zod v4

**The Fix:** Zod v4 has a **native** `z.toJSONSchema()` function that works correctly:
```typescript
// BROKEN (zod-to-json-schema with Zod v4)
zodToJsonSchema(schema, { $refStrategy: "none" }) // Returns empty {}

// WORKS (Zod v4 native)
z.toJSONSchema(schema) // Returns proper schema with no $refs
```

**Action:** Updating implementation to use `z.toJSONSchema()` instead of the external library.

**Result:** Successfully implemented and tested. The API now uses:
- `z.toJSONSchema(PortfolioAnalysisSchema)` for schema generation
- `responseSchema` parameter in Gemini config for structured output enforcement
- Removed `zod-to-json-schema` dependency entirely

---

## 2026-01-25 - Iteration 3 Results Evaluation & Iteration 4 Plan

**Topic:** Gemini evaluates the live portfolio analysis output and proposes upgrades

**Gemini said:**

### Evaluation of Iteration 3 Results

**The Good:**
- **It Works**: The pipeline (PDF -> Text -> Gemini -> JSON) is functional.
- **Core Risks Found**: It correctly identified "Break Clauses" and "Repair Obligations," which are the "Big Two" for most tenants.
- **Portfolio View**: The table comparison is working as intended.

**The Bad (Critical Gaps):**

1. **"Financial Blindness"**: Missing the Turnover Rent (8%) and Promotion Levy is a critical failure. These are direct P&L impacts that a CFO cares about more than a "Schedule of Condition."

2. **"Scoring Saturation"**: Giving both high-risk leases 100/100 makes the score useless. A nuclear power plant is high risk; a retail store is high risk. They are not the same. We need nuance.

3. **"Magic Numbers"**: The £89,972.5 figure is suspicious. Without a clear "Show Your Work" step, users will distrust the math.

4. **Confidence Bug**: The 1% confidence is clearly a 0.0-1.0 vs 0-100 scaling error.

---

### Plan: Iteration 4 (The "Senior Partner" Upgrade)

We don't need new infrastructure. We need to upgrade the Brain (The Prompt).

**Step 1: Upgrade the Prompt (`lib/ai/prompts-portfolio.ts`)**

We will rewrite the prompt to specifically target the blind spots:

- **Add "Hidden Costs" Category**: explicitly ask for "Turnover/Percentage Rent", "Marketing Levies", and "Service Charge Caps".
- **Implement "Weighted Scoring"**:
  - Critical (e.g., No Break Option): +25 pts
  - Financial (e.g., Turnover Rent): +15 pts
  - Operational (e.g., Keep Open): +10 pts
  - Cap at 95 (reserve 100 for "Immediate Bankruptcy Risk").
- **Enforce "Math Transparency"**: Ask the AI to output `calculation_logic` for any monetary figure.
- **Fix Confidence**: Explicitly instruct "Return confidence as a number between 0 and 100".

**Step 2: Add "Citation" Support**

Modify the TypeScript interfaces to require a `quote` and `page_reference` for every insight. This stops hallucinations cold.

---

## 2026-01-25 - Scaling Discussion: Map-Reduce Architecture

**Topic:** How to handle 10-20 full-length leases without timeout/accuracy issues

**Context:** User asked about scaling beyond 3 short demo leases to real-world portfolio sizes.

**Gemini said:**

### The Problem with Scaling

While 3 short leases are "easy mode," shifting to 10-20+ full-length UK commercial leases (50-100 pages each) introduces two major bottlenecks:

1. **Latency ("Spinning Wheel of Death")**: Processing large PDFs in a single API call takes minutes. Standard web requests (Vercel/Netlify) timeout after 10-60 seconds.

2. **Reasoning Degradation**: Even with Gemini's 1M token window, asking it to "compare 20 documents" in one go dramatically increases hallucination risk (the "Lost in the Middle" phenomenon).

### The Solution: Map-Reduce Architecture

Instead of sending everything to the AI at once, break it down into two phases:

**Phase 1: The "Map" (Parallel Extraction)**
- Process each lease individually in parallel
- Frontend sends 5 requests for 5 files simultaneously
- AI Task: "Extract key terms from THIS specific lease (Rent, Break Date, Repair Clause)"
- Result: 20 clean, structured JSON objects (not 20 raw PDFs)
- Benefits:
  - Speed: 10 leases take same time as 1 (parallel)
  - Accuracy: AI only looks at one document at a time

**Phase 2: The "Reduce" (Portfolio Synthesis)**
- Take the 20 JSON summaries (tiny compared to PDFs) and send to AI in one final prompt
- AI Task: "Here is data for 20 leases. Find outliers. Calculate total exposure. Who has worst terms?"
- Benefits: Reasoning over structured data, not raw noise. Fast and accurate.

### The Unified Plan: "Scalable Senior Partner"

Implement Map-Reduce AND Iteration 4 improvements together:

**Agent A: The Forensic Auditor (Extraction)**
- Endpoint: `/api/extract-lease`
- Input: 1 PDF file
- Iteration 4 upgrades built-in:
  - "Find Turnover Rent % and strict definitions"
  - "Find Marketing Levies and hidden Service Charge caps"
  - "Extract exact quotes for Schedule of Condition"
- Output: High-fidelity structured JSON for that specific lease

**Agent B: The Portfolio Strategist (Synthesis)**
- Endpoint: `/api/synthesize-portfolio`
- Input: Array of JSON objects from Agent A
- Iteration 4 upgrades built-in:
  - "Apply weighted scoring: +25 pts for missing breaks, +15 pts for Turnover Rent"
  - "Identify outliers: Which lease has the worst Repair clause?"
  - "Show math: Explain exactly how you calculated total Portfolio Risk"
- Output: Final Dashboard data

### Why Combine Both Now?

If we do Iteration 4 first on the old monolithic architecture, we'll have to delete it all when moving to 20 leases. Doing them together avoids writing code twice.

### Execution Steps

1. **Dependencies**: unpdf, zod (already installed)
2. **Prompts**: Create `prompts-extraction.ts` (Forensic Auditor) and `prompts-synthesis.ts` (Strategist)
3. **API**: Create two endpoints (`/extract` and `/synthesize`)
4. **Frontend**: Update `page.tsx` for batch processing with progress bar

### Demo Benefits

- Progress bar instead of 60-second spinner: "Processing Lease 1 of 12..."
- Scalable from 3 to 300 leases
- Higher accuracy (Agent A focuses on one document)
- The "Kardos Hook" - looks incredibly technical and real

---

## 2026-01-25 - Claude's Plan Evaluation by Gemini

**Topic:** Gemini evaluates the unified "Scalable Senior Partner" plan

**Gemini said:**

### Evaluation: EXCEPTIONAL (A++)

This plan is a masterclass in system design for LLM applications. It solves the two biggest problems in "Enterprise AI" demos:

1. **Latency/Timeouts**: By shifting to "Map-Reduce" (Batch Processing), it completely bypasses the 60s HTTP timeout limit. The UI can show a progress bar for 10 minutes if needed, and the user will feel "it's working hard" rather than "it's broken."

2. **Context Degradation**: By focusing the AI on one document at a time (Agent A), we drastically reduce hallucinations. "Turnover Rent" won't get lost in the noise of 49 other leases.

### The "Risk Calculation Logic" Field - Brilliant Addition

- **Old Way**: "Exposure: £89,972.5" (User: "Where did that come from?")
- **New Way**: "Exposure: £89,972.5 (Logic: Base Rent £50k + £12k Turnover Rent (est) + £27k Uncapped Repair Liability)"
- **Why it wins**: Trust. CFOs don't trust black boxes. They trust spreadsheets. This output structure mimics a spreadsheet formula.

### One Minor Adjustment

Add a simple "Cache" mechanism (even just in-memory or file-based for the demo) for the extract-lease step. If the user uploads the same "Standard Lease" 10 times (common in testing), we shouldn't pay for 10 API calls.

- **Fix**: Add a simple check: `if (filename in cache) return cache[filename]`. Trivial to add in the API route.

**Recommendation: Execute Immediately. This is the correct path to a "Wow" demo.**

---
