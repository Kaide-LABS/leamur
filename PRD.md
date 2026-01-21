# Product Requirements Document: The Sentinel
## Autonomous Invoice Audit Agent - Leamur.ai Demo

**Version:** 1.0
**Date:** 2026-01-21
**Status:** Ready for Development

---

## 1. Executive Summary

### 1.1 What We're Building
A high-fidelity product demo called **"The Sentinel"** - an autonomous invoice audit agent that demonstrates how AI can eliminate "financial leakage" for commercial tenants by cross-referencing landlord invoices against lease contracts.

### 1.2 Why We're Building It
To pitch Leamur.ai's founders with a working prototype that:
- Validates their core thesis (AI as auditor, not just data extractor)
- Accelerates their roadmap by 12-18 months
- Makes rejection a "strategic error" for them

### 1.3 Target Audience (The Pitch Recipients)
| Person | Role | What They Care About |
|--------|------|---------------------|
| **Örs Kardos** | Technical Founder | Deterministic systems, audit trails, no "black box" AI, performance metrics |
| **James Nurcombe** | Commercial Director | ROI, EBITDA impact, financial risk mitigation, speed to value |

---

## 2. Problem Statement

### 2.1 The "Financial Leakage" Epidemic
Commercial tenants systematically overpay landlords due to:

| Vector | Failure Mode | Financial Impact |
|--------|--------------|------------------|
| **Service Charge Abuse** | Landlords bill for items excluded in lease | 10-15% annual OpEx overpayment |
| **Missed Critical Dates** | Break clauses missed due to calendar failures | Years of unwanted rent (£Ms) |
| **Indexation Errors** | Wrong RPI/CPI calculations | Compounded rent overpayment |

### 2.2 Why Current Tools Fail
- **Visual Lease, MRI ProLease**: Passive "systems of record" - they store data but don't audit
- **No cross-referencing**: Invoice arrives → gets paid → no one checks if it's valid
- **Manual review impossible**: 50-page leases with complex clause logic

### 2.3 The Sentinel's Value Proposition
Transform tenants from **passive payers** to **active auditors** by automatically:
1. Ingesting invoices
2. Extracting line items
3. Cross-referencing against lease clauses
4. Flagging invalid charges
5. Quantifying savings

---

## 3. Product Requirements

### 3.1 Core User Journey (Demo Flow)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         THE SENTINEL - DEMO FLOW                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STEP 1: UPLOAD              STEP 2: PROCESS           STEP 3: AUDIT   │
│  ┌──────────────┐           ┌──────────────┐         ┌──────────────┐  │
│  │              │           │ Log Stream   │         │ Split Screen │  │
│  │  Drop Zone   │  ──────►  │ [timestamps] │ ──────► │ Doc | Audit  │  │
│  │  (Invoice)   │           │ [metrics]    │         │ Panel        │  │
│  └──────────────┘           └──────────────┘         └──────────────┘  │
│                                                              │          │
│                                                              ▼          │
│                                                      ┌──────────────┐  │
│                              STEP 4: ACTION          │ Dispute      │  │
│                              ◄─────────────────────  │ + ROI Stats  │  │
│                                                      └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Functional Requirements

#### FR-1: Document Upload
- **FR-1.1**: User can drag-and-drop or click to upload an "invoice"
- **FR-1.2**: Visual feedback on upload (file name, size displayed)
- **FR-1.3**: "Analyze" button triggers the processing sequence

#### FR-2: Processing Log Stream (Kardos Hook)
- **FR-2.1**: Real-time log entries with timestamps
- **FR-2.2**: Each log shows: `[timestamp] [SERVICE] Message (metrics)`
- **FR-2.3**: Log entries appear sequentially with realistic timing
- **FR-2.4**: Services shown: `OCR-SERVICE`, `VECTOR-DB`, `LEASE-RETRIEVAL`, `AUDIT-ENGINE`

**Example Log Sequence:**
```
[20:14:23.045] [OCR-SERVICE] Document received (Size: 245KB, Pages: 2)
[20:14:23.187] [OCR-SERVICE] Extracted 12 line items (Latency: 142ms, Confidence: 0.994)
[20:14:23.201] [VECTOR-DB] Embedding generated (Dimensions: 1536)
[20:14:23.445] [LEASE-RETRIEVAL] Matched to Lease: Unit 4B, 123 High Street
[20:14:23.612] [AUDIT-ENGINE] Comparing line items against 47 lease clauses...
[20:14:24.102] [AUDIT-ENGINE] ANOMALY DETECTED: Line item 7 flagged (Confidence: 0.971)
```

#### FR-3: Split-Screen Document View
- **FR-3.1**: Left panel shows the "Invoice" document (styled HTML, not PDF)
- **FR-3.2**: Right panel shows "Audit Results" with extracted data
- **FR-3.3**: Clicking an item in right panel highlights corresponding area in left panel
- **FR-3.4**: Tab to switch between "Invoice View" and "Lease View"

#### FR-4: Anomaly Detection & Highlighting
- **FR-4.1**: Invalid line items highlighted in red on the document
- **FR-4.2**: Alert banner shows: "INVALID CHARGE DETECTED"
- **FR-4.3**: Displays the specific lease clause that invalidates the charge
- **FR-4.4**: Shows confidence score for the detection

#### FR-5: Reasoning Panel (Audit Trail)
- **FR-5.1**: Expandable panel showing Chain of Thought reasoning
- **FR-5.2**: Step-by-step logic: what was compared, why it's invalid
- **FR-5.3**: Citations link back to specific clause numbers

**Example Reasoning:**
```
AUDIT REASONING CHAIN
─────────────────────
Step 1: Identified charge category: "Service Charge - Maintenance"
Step 2: Retrieved relevant clauses: 23.1(a), 23.1(b), 23.2, Schedule 4
Step 3: Clause 23.1(b) contains explicit exclusion list
Step 4: Compared "Facade Cleaning" against exclusion list
Step 5: MATCH FOUND: "external facade" explicitly excluded
        → Charge is Landlord responsibility, not Tenant
```

#### FR-6: ROI Dashboard (Nurcombe Hook)
- **FR-6.1**: Prominent savings counter: "Potential Savings: £12,000"
- **FR-6.2**: Animated count-up effect when anomaly is found
- **FR-6.3**: Mini timeline chart showing cumulative savings
- **FR-6.4**: "Dispute" button that shows auto-generated email draft

#### FR-7: Dispute Action
- **FR-7.1**: Modal with pre-drafted email to landlord
- **FR-7.2**: Email cites specific lease clause and invoice line
- **FR-7.3**: Professional, legally-appropriate tone
- **FR-7.4**: Copy-to-clipboard functionality

---

## 4. Technical Architecture

### 4.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 14 (App Router) | Fast, modern, aligns with Leamur's likely stack |
| **Styling** | Tailwind CSS | Enterprise fintech aesthetic, rapid iteration |
| **Animations** | Framer Motion | Smooth transitions for log stream, highlights |
| **State** | React useState/useReducer | **Intentionally simple**: If Kardos inspects the source code, clean hooks are more impressive than over-engineered Redux boilerplate. Demo code should be readable and demonstrate competence, not complexity. |
| **Charts** | Recharts or custom SVG | Savings timeline visualization |
| **AI** | Gemini 3.0 Flash + GPT-5.2 | Split-task: Flash for retrieval, GPT-5.2 for reasoning. Mock fallback for pitch safety. |

### 4.2 AI Integration Architecture (Split-Task Multi-Agent)

**Strategy**: Mock data by default, real AI via toggle. Two specialized AI models for maximum impact.

**Mode Switching**:
- Default: Mock mode (hardcoded responses)
- Toggle: URL param `?live=true` enables live AI
- Fallback: If either API fails, gracefully revert to mock

---

**The "Best of Breed" Architecture**:

| Model | Role | Task | Why |
|-------|------|------|-----|
| **Gemini 3.0 Flash** | "The Reader" | Document ingestion, clause retrieval | Massive context window, sub-second speed, multimodal |
| **GPT-5.2** | "The Lawyer" | Legal reasoning, Chain of Thought | Superior complex reasoning, precise structured output |

**Pipeline Flow**:
```
Invoice + Lease → [Gemini Flash] → Relevant Clauses → [GPT-5.2] → Audit Result + Reasoning
```

**Step 1: Gemini Flash (Retrieval)**

> **Choke Point Fix**: Gemini must return structured JSON with sufficient context (3 paragraphs before/after) to prevent GPT-5.2 hallucination.

```typescript
// lib/ai/gemini.ts
// Input: Full lease document + invoice
// Output: Structured JSON with relevant clauses + context
const retrieveClauses = async (lease: string, invoice: Invoice) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.0-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `You are a lease document analyst. Given this lease and invoice,
find ALL clauses relevant to each invoice line item.

CRITICAL: For each clause found, return:
- The clause number
- The FULL text of the clause
- 3 paragraphs BEFORE the clause (for context)
- 3 paragraphs AFTER the clause (for context)

Return as JSON:
{
  "relevantClauses": [
    {
      "clauseNumber": "string",
      "clauseTitle": "string",
      "fullText": "string",
      "contextBefore": "string",
      "contextAfter": "string",
      "relatedLineItems": [lineItemIds]
    }
  ]
}

LEASE DOCUMENT:
${lease}

INVOICE LINE ITEMS:
${JSON.stringify(invoice.lineItems)}`;

  return model.generateContent(prompt);
};
```

**Step 2: GPT-5.2 (Reasoning)**
```typescript
// lib/ai/openai.ts
// Input: Specific clauses + specific line item
// Output: Structured audit result with Chain of Thought
const analyzeCharge = async (clause: string, lineItem: LineItem) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: "You are a senior commercial lease solicitor..." },
      { role: "user", content: `Analyze if this charge is valid: ${lineItem}
                                Against this clause: ${clause}` }
    ],
    response_format: { type: "json_object" }
  });
  return JSON.parse(completion.choices[0].message.content);
};
```

**Combined Pipeline**:
```typescript
// lib/ai/index.ts
export const analyzeInvoice = async (
  invoice: Invoice,
  lease: string,
  mode: 'mock' | 'live' = 'mock'
): Promise<AuditResult> => {
  if (mode === 'mock') return mockAuditResult;

  try {
    // Step 1: Gemini finds relevant clauses
    const relevantClauses = await retrieveClauses(lease, invoice);

    // Step 2: GPT-5.2 reasons about each flagged item
    const auditResult = await analyzeCharge(relevantClauses, invoice.lineItems[6]);

    return auditResult;
  } catch (error) {
    console.error('AI failed, falling back to mock:', error);
    return mockAuditResult;
  }
};
```

**API Route** (Next.js):
```
app/api/analyze/route.ts
```
- POST endpoint receives invoice + lease
- Orchestrates Gemini → GPT-5.2 pipeline
- Returns structured AuditResult
- Graceful fallback on any failure

**Environment Variables**:
```env
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key
AI_MODE=mock  # or 'live'
```

### 4.3 Project Structure

```
leamur-sentinel-demo/
├── app/
│   ├── layout.tsx           # Root layout with fonts, metadata
│   ├── page.tsx             # Main demo page
│   ├── globals.css          # Global styles
│   └── api/
│       └── analyze/
│           └── route.ts     # AI analysis endpoint
├── components/
│   ├── upload/
│   │   └── DropZone.tsx     # File upload component
│   ├── processing/
│   │   └── LogStream.tsx    # Terminal-style log display
│   ├── document/
│   │   ├── DocumentStage.tsx    # Split-screen container
│   │   ├── InvoiceView.tsx      # Fake invoice (HTML/CSS)
│   │   ├── LeaseView.tsx        # Fake lease clause (HTML/CSS)
│   │   └── HighlightOverlay.tsx # Red box overlays
│   ├── audit/
│   │   ├── AuditPanel.tsx       # Right-side results panel
│   │   ├── ReasoningPanel.tsx   # Chain of thought display
│   │   └── AnomalyAlert.tsx     # Red alert banner
│   ├── dashboard/
│   │   ├── SavingsCounter.tsx   # Animated £ counter
│   │   └── SavingsTimeline.tsx  # Mini chart
│   └── actions/
│       └── DisputeModal.tsx     # Email draft modal
├── data/
│   ├── invoice.ts           # Mock invoice data
│   ├── lease.ts             # Mock lease clauses
│   ├── logs.ts              # Scripted log sequence
│   └── reasoning.ts         # Chain of thought steps (mock fallback)
├── lib/
│   ├── types.ts             # TypeScript interfaces
│   ├── utils.ts             # Helper functions
│   ├── ai/
│   │   ├── index.ts         # AI provider router
│   │   ├── gemini.ts        # Gemini API client
│   │   ├── openai.ts        # OpenAI API client
│   │   └── prompts.ts       # Audit prompt templates
│   └── hooks/
│       └── useAIMode.ts     # Hook for mode switching (mock/live)
├── .env.local               # API keys (gitignored)
└── public/
    └── fonts/               # Professional typography
```

### 4.3 Component Hierarchy

```
<App>
  ├── <Header>                    # Logo, title
  ├── <DemoContainer>
  │   ├── <DropZone />            # Phase 1: Upload
  │   ├── <LogStream />           # Phase 2: Processing
  │   └── <DocumentStage>         # Phase 3: Results
  │       ├── <DocumentPanel>
  │       │   ├── <InvoiceView />
  │       │   ├── <LeaseView />
  │       │   └── <HighlightOverlay />
  │       └── <AuditPanel>
  │           ├── <AnomalyAlert />
  │           ├── <ExtractedItems />
  │           └── <ReasoningPanel />
  ├── <Dashboard>
  │   ├── <SavingsCounter />
  │   └── <SavingsTimeline />
  └── <DisputeModal />            # Phase 4: Action
```

### 4.4 State Machine

```
┌─────────┐     upload      ┌────────────┐    complete    ┌─────────┐
│  IDLE   │ ──────────────► │ PROCESSING │ ─────────────► │ RESULTS │
└─────────┘                 └────────────┘                └─────────┘
     ▲                                                          │
     │                        reset                             │
     └──────────────────────────────────────────────────────────┘
```

**States:**
- `IDLE`: Show upload dropzone
- `PROCESSING`: Show log stream, simulate analysis
- `RESULTS`: Show split-screen with findings

---

## 5. Mock Data Specification

### 5.1 The Invoice (Q4 Service Charge)

```typescript
interface Invoice {
  id: string;
  property: string;
  period: string;
  landlord: string;
  totalAmount: number;
  lineItems: LineItem[];
}

// Example data
const mockInvoice: Invoice = {
  id: "INV-2025-Q4-0847",
  property: "Unit 4B, 123 High Street, London EC2A 4NE",
  period: "Q4 2025 (Oct - Dec)",
  landlord: "Meridian Property Holdings Ltd",
  totalAmount: 47250.00,
  lineItems: [
    { id: 1, description: "Building Insurance", amount: 3200.00, valid: true },
    { id: 2, description: "Security Services", amount: 8500.00, valid: true },
    { id: 3, description: "Cleaning - Common Areas", amount: 4200.00, valid: true },
    { id: 4, description: "Lift Maintenance", amount: 2800.00, valid: true },
    { id: 5, description: "HVAC Maintenance", amount: 6100.00, valid: true },
    { id: 6, description: "Utilities - Common Areas", amount: 5450.00, valid: true },
    { id: 7, description: "Facade Cleaning - External", amount: 12000.00, valid: false }, // THE ANOMALY
    { id: 8, description: "Management Fee (10%)", amount: 5000.00, valid: true },
  ]
};
```

### 5.2 The Lease Clause (Service Charge Exclusions)

```typescript
const leaseClause = {
  clauseNumber: "23.1(b)",
  title: "Service Charge Exclusions",
  text: `The Service Charge shall NOT include any costs incurred by the
Landlord in respect of:

(i) the initial construction, design or letting of the Building;
(ii) any works to remedy inherent defects in the Building;
(iii) external facade cleaning, maintenance or repair of the
     external envelope of the Building including all external
     glazing, cladding and structural elements;
(iv) any costs recoverable under insurance policies;
(v) any costs incurred due to the Landlord's negligence.`,
  relevantParagraph: "(iii)", // The one that catches the error
};
```

### 5.3 The Reasoning Chain

```typescript
const reasoningSteps = [
  {
    step: 1,
    action: "CATEGORIZE",
    detail: "Identified charge category: 'Service Charge - Maintenance'",
    confidence: 0.994
  },
  {
    step: 2,
    action: "RETRIEVE",
    detail: "Retrieved relevant lease clauses: 23.1(a), 23.1(b), 23.2, Schedule 4",
    confidence: 0.987
  },
  {
    step: 3,
    action: "ANALYZE",
    detail: "Clause 23.1(b) contains explicit exclusion list for Service Charges",
    confidence: 0.991
  },
  {
    step: 4,
    action: "COMPARE",
    detail: "Comparing 'Facade Cleaning - External' against exclusion criteria",
    confidence: 0.984
  },
  {
    step: 5,
    action: "MATCH",
    detail: "MATCH FOUND: Item (iii) explicitly excludes 'external facade cleaning'",
    confidence: 0.971
  },
  {
    step: 6,
    action: "CONCLUDE",
    detail: "Charge is Landlord responsibility per Clause 23.1(b)(iii). Recommend dispute.",
    confidence: 0.968
  }
];
```

---

## 6. UI/UX Specification

### 6.1 Visual Design System

**Color Palette:**
| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | Deep Navy | `#0F172A` | Headers, primary text |
| Secondary | Slate | `#475569` | Secondary text, borders |
| Accent | Blue | `#3B82F6` | Interactive elements, links |
| Success | Green | `#10B981` | Valid items, savings |
| Danger | Red | `#EF4444` | Anomalies, alerts |
| Background | Off-white | `#F8FAFC` | Page background |
| Surface | White | `#FFFFFF` | Cards, panels |

**Typography:**
- **Headings**: Inter (600 weight)
- **Body**: Inter (400 weight)
- **Monospace** (logs, numbers): JetBrains Mono

**Document Styling (Fake PDF Look):**
- Light cream background (`#FFFEF7`)
- Subtle drop shadow
- Slight border radius
- "Paper texture" via CSS grain effect
- Serif font for legal text (Georgia or similar)

**Paper Texture CSS Implementation (No External Assets):**
```css
/* Subtle paper grain using inline SVG noise filter */
.paper-texture {
  background-color: #FFFEF7;
  position: relative;
}

.paper-texture::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  mix-blend-mode: multiply;
}

/* Horizontal line texture for aged paper effect */
.paper-texture::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 1px,
    rgba(0,0,0,0.008) 1px,
    rgba(0,0,0,0.008) 2px
  );
  pointer-events: none;
}
```

### 6.2 Responsive Behavior
- **Desktop (1200px+)**: Full split-screen experience
- **Tablet (768-1199px)**: Stacked panels with tabs
- **Mobile**: Not prioritized (enterprise demo)

### 6.3 Animation Specifications

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Log entries | Fade in + slide up | 150ms | ease-out |
| Highlight overlay | Fade in + pulse | 300ms | ease-in-out |
| Savings counter | Count up | 1000ms | ease-out |
| Panel transitions | Slide | 200ms | ease-in-out |
| Alert banner | Slide down | 300ms | spring |

---

## 7. Demo Script (Presentation Flow)

### Scene 1: The Setup (30 seconds)
> "Imagine you're a Real Estate Director at a retail chain. You receive this service charge invoice from your landlord. £47,000 for Q4. Looks normal. Your team would typically just... pay it."

### Scene 2: The Upload (10 seconds)
*Drag invoice into drop zone*
> "Let's see what The Sentinel finds."

### Scene 3: The Processing (15 seconds)
*Watch log stream*
> "Notice these aren't fake loading bars. You're seeing actual processing metrics - latency, confidence scores. This is a deterministic pipeline, not a black box."

### Scene 4: The Discovery (30 seconds)
*Anomaly revealed*
> "There it is. £12,000 for facade cleaning. The Sentinel found this charge violates Clause 23.1(b) of your lease. External facade maintenance is explicitly excluded from service charges. This is the landlord's cost, not yours."

### Scene 5: The Proof (20 seconds)
*Show reasoning panel*
> "Here's exactly how it reached that conclusion. Step by step. Every inference is grounded in the actual lease text. No hallucination."

### Scene 6: The Action (15 seconds)
*Click Dispute button*
> "One click. Draft email to your landlord, citing the specific clause. That's £12,000 back in your pocket in under 2 minutes."

### Scene 7: The Close
> "This is what Leamur becomes with The Sentinel. Not a database. An auditor. The question isn't whether you need this. It's how much you're losing every quarter without it."

---

## 8. Success Metrics

### 8.1 Demo Success Criteria
- [ ] Loads in under 2 seconds
- [ ] Zero errors during presentation
- [ ] Log stream feels authentic (timing, metrics)
- [ ] Anomaly highlight is visually impactful
- [ ] Reasoning chain is believable
- [ ] "Dispute" email sounds legally credible
- [ ] Overall aesthetic: "enterprise fintech" quality

### 8.2 Pitch Success Criteria
- [ ] Örs asks technical follow-up questions (engagement signal)
- [ ] James asks about integration/pricing (buying signal)
- [ ] Request for second meeting
- [ ] "Can you show this to our team?"

---

## 9. Development Phases (Iterative Execution Strategy)

> **Important**: Do NOT execute all phases at once. Break into iterations with checkpoints to catch errors early.

---

### ITERATION 1: Foundation + Data (Phases 1 & 2)
**Goal**: Get the empty app running and data ready.

**Phase 1: Foundation**
- [ ] Next.js 14 project setup (`create-next-app`)
- [ ] Install dependencies (framer-motion, lucide-react, clsx, tailwind-merge, @google/generative-ai, openai)
- [ ] Tailwind configuration with custom colors
- [ ] Base layout with fonts (Inter, JetBrains Mono)
- [ ] Global CSS with paper texture classes
- [ ] Type definitions (`lib/types.ts`)
- [ ] Create `.env.local` with API keys (GEMINI_API_KEY, OPENAI_API_KEY, AI_DEFAULT_PROVIDER)

**Phase 2: Mock Data**
- [ ] Invoice data structure (`data/invoice.ts`)
- [ ] Lease clause data (`data/lease.ts`)
- [ ] Log sequence script with timing (`data/logs.ts`)
- [ ] Reasoning chain data (`data/reasoning.ts`) - serves as mock fallback

**CHECKPOINT 1**: Run `npm run dev` - page loads without errors. Import data files to verify. Env vars loaded.

---

### ITERATION 2: Core UI Components (Phase 3)
**Goal**: Build the visual "stage" for the demo.

**Phase 3: Core Components**
- [ ] DropZone upload component
- [ ] LogStream terminal (the "Kardos Hook")
- [ ] DocumentStage split-screen container
- [ ] InvoiceView (styled HTML with paper texture)
- [ ] LeaseView (styled HTML with paper texture)
- [ ] HighlightOverlay for red box overlays

**CHECKPOINT 2**: Visual inspection - DropZone looks right, fake PDFs look realistic with paper texture.

---

### ITERATION 3: Logic & Interactivity (Phases 4, 5, 6 & AI)
**Goal**: Make it alive. Connect the state machine. Enable AI.

**Phase 4: Audit Features**
- [ ] AuditPanel with extracted items
- [ ] AnomalyAlert banner
- [ ] ReasoningPanel (Chain of Thought)

**Phase 5: Dashboard & Actions**
- [ ] SavingsCounter with animation (the "Nurcombe Hook")
- [ ] SavingsTimeline chart (custom SVG)
- [ ] DisputeModal with email draft

**Phase 6: State & Flow**
- [ ] Implement useReducer state machine (IDLE → PROCESSING → RESULTS)
- [ ] Wire up timed log sequence playback
- [ ] Connect full demo flow

**Phase 7: AI Integration (Hybrid Mode)**
- [ ] Create `lib/ai/prompts.ts` - audit prompt templates
- [ ] Create `lib/ai/gemini.ts` - Gemini API client
- [ ] Create `lib/ai/openai.ts` - OpenAI API client
- [ ] Create `lib/ai/index.ts` - provider router with mock fallback
- [ ] Create `app/api/analyze/route.ts` - API endpoint
- [ ] Create `lib/hooks/useAIMode.ts` - mode switching hook (URL param `?live=true`)
- [ ] Integrate AI into demo flow (call API in PROCESSING state)
- [ ] Add graceful fallback to mock if API fails

**CHECKPOINT 3**:
- Mock mode: Full flow works with hardcoded data
- Live mode (`?live=true`): Real AI generates reasoning chain
- Fallback: If AI fails, gracefully reverts to mock

---

### ITERATION 4: Polish & Deploy (Phase 7)
**Goal**: Make it pitch-ready.

**Phase 7: Polish**
- [ ] Animation timing refinement (realistic latency variance)
- [ ] Visual consistency pass
- [ ] Demo script rehearsal
- [ ] Edge case handling
- [ ] Build (`npm run build`)
- [ ] Deploy to Netlify

**CHECKPOINT 4**: Production build succeeds. Deployed demo runs flawlessly.

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Fake documents look too fake | Credibility loss | Invest in typography, paper texture styling |
| Log timing feels artificial | Örs sees through it | Use realistic latency variance (not uniform) |
| Lease clause sounds made up | Legal credibility | Research real UK commercial lease language |
| Demo crashes during pitch | Fatal | Pre-load everything, zero external dependencies |
| Animation feels gimmicky | Cheap impression | Subtle, functional animations only |

---

## Appendix A: Reference Materials

- **Leamur Strategic Dossier**: `context.md`
- **Gemini Collaboration Log**: `gemini_context.md`
- **UK Commercial Lease Templates**: Research for authentic clause language
- **Visual Lease UI Screenshots**: Reference for "what not to do"

---

*Document prepared for Leamur.ai demo development*
