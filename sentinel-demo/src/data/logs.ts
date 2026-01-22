import type { LogEntry } from "@/lib/types";

// Add small variance to delays for more natural timing
// Base delays spread over ~6-8 seconds total
export const mockLogs: LogEntry[] = [
  {
    timestamp: "14:32:01.234",
    service: "OCR-SERVICE",
    message: "Processing invoice INV-2026-00847 | 8 line items extracted",
    metrics: "confidence: 98.7%",
    delay: 0, // Immediate start
  },
  {
    timestamp: "14:32:01.856",
    service: "VECTOR-DB",
    message: "Embedding 8 line item descriptions | Chunk size: 512 tokens",
    delay: 650, // ~600ms from start
  },
  {
    timestamp: "14:32:02.623",
    service: "LEASE-RETRIEVAL",
    message: "Querying lease document for property: One Canada Square",
    metrics: "doc_id: LEASE-CW-2024-001",
    delay: 1450, // ~1400ms from start
  },
  {
    timestamp: "14:32:03.567",
    service: "LEASE-RETRIEVAL",
    message: "Retrieved 12 relevant clauses | Top match: Clause 23.1(b)",
    metrics: "similarity: 0.94",
    delay: 2850, // ~2800ms from start (retrieval takes longer)
  },
  {
    timestamp: "14:32:04.321",
    service: "AUDIT-ENGINE",
    message: "Analyzing line items against exclusion clauses...",
    delay: 4250, // ~4200ms from start
  },
  {
    timestamp: "14:32:05.892",
    service: "AUDIT-ENGINE",
    message: "ANOMALY DETECTED: Item #7 'Facade Cleaning' matches exclusion 23.1(b)(iii)",
    metrics: "savings: £12,000",
    delay: 6100, // ~6000ms from start (dramatic pause before anomaly)
  },
];
