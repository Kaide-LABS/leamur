/**
 * JSON Schema for LeaseExtraction — used with Gemini's responseJsonSchema
 * to enforce constrained decoding and reduce malformed JSON output.
 */
export const EXTRACTION_JSON_SCHEMA = {
  type: "object",
  required: [
    "id",
    "filename",
    "extraction_timestamp",
    "property_address",
    "landlord",
    "tenant",
    "financial_terms",
    "timeline",
    "clauses",
    "risk_score",
    "risk_calculation_logic",
    "risk_factors",
    "overall_confidence",
    "extraction_notes",
  ],
  properties: {
    id: { type: "string" },
    filename: { type: "string" },
    extraction_timestamp: { type: "string" },
    property_address: { type: "string" },
    landlord: { type: "string" },
    tenant: { type: "string" },
    financial_terms: {
      type: "object",
      required: ["base_rent", "admin_fees"],
      properties: {
        base_rent: {
          type: "object",
          required: ["annual_amount", "currency", "clause_reference"],
          properties: {
            annual_amount: { type: "number" },
            currency: { type: "string" },
            clause_reference: { type: "string" },
          },
        },
        turnover_rent: {
          type: "object",
          properties: {
            percentage: { type: "number" },
            threshold: { type: "number" },
            clause_reference: { type: "string" },
          },
        },
        promotion_levy: {
          type: "object",
          properties: {
            percentage: { type: "number" },
            fixed_amount: { type: "number" },
            clause_reference: { type: "string" },
          },
        },
        service_charge_cap: {
          type: "object",
          properties: {
            cap_percentage: { type: "number" },
            cap_amount: { type: "number" },
            clause_reference: { type: "string" },
          },
        },
        admin_fees: {
          type: "array",
          items: {
            type: "object",
            required: ["type", "amount", "clause_reference"],
            properties: {
              type: { type: "string" },
              amount: { type: "number" },
              clause_reference: { type: "string" },
            },
          },
        },
      },
    },
    timeline: {
      type: "object",
      required: [
        "start_date",
        "end_date",
        "term_years",
        "break_options",
        "rent_review_dates",
      ],
      properties: {
        start_date: { type: "string" },
        end_date: { type: "string" },
        term_years: { type: "number" },
        break_options: {
          type: "array",
          items: {
            type: "object",
            required: ["date", "conditions", "clause_reference"],
            properties: {
              date: { type: "string" },
              conditions: { type: "string" },
              clause_reference: { type: "string" },
            },
          },
        },
        rent_review_dates: {
          type: "array",
          items: {
            type: "object",
            required: ["date", "mechanism", "clause_reference"],
            properties: {
              date: { type: "string" },
              mechanism: {
                type: "string",
                enum: ["upward-only", "open-market", "fixed", "indexed"],
              },
              clause_reference: { type: "string" },
            },
          },
        },
      },
    },
    clauses: {
      type: "array",
      items: {
        type: "object",
        required: [
          "clause_reference",
          "verbatim_text",
          "category",
          "risk_level",
          "risk_rationale",
        ],
        properties: {
          clause_reference: { type: "string" },
          verbatim_text: { type: "string" },
          category: {
            type: "string",
            enum: [
              "break-clause",
              "rent-review",
              "repair",
              "admin-fee",
              "turnover-rent",
              "promotion-levy",
              "service-charge",
              "pandemic",
              "alienation",
              "forfeiture",
              "insurance",
              "dilapidations",
            ],
          },
          risk_level: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          risk_rationale: { type: "string" },
          value: { type: "string" },
        },
      },
    },
    risk_score: { type: "number" },
    risk_calculation_logic: { type: "string" },
    risk_factors: {
      type: "array",
      items: { type: "string" },
    },
    overall_confidence: { type: "number" },
    extraction_notes: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;
