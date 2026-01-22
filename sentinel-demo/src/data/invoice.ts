import type { Invoice } from "@/lib/types";

export const mockInvoice: Invoice = {
  id: "INV-2026-00847",
  property: "One Canada Square, Canary Wharf, London E14 5AB",
  period: "Q4 2025 Service Charge",
  landlord: "Canary Wharf Management Limited",
  totalAmount: 47250,
  lineItems: [
    {
      id: 1,
      description: "Building Insurance Premium",
      amount: 8500,
      valid: true,
    },
    {
      id: 2,
      description: "Security Services - 24/7 Patrol",
      amount: 6200,
      valid: true,
    },
    {
      id: 3,
      description: "HVAC Maintenance & Repairs",
      amount: 4800,
      valid: true,
    },
    {
      id: 4,
      description: "Lift Maintenance Contract",
      amount: 3200,
      valid: true,
    },
    {
      id: 5,
      description: "Common Area Cleaning",
      amount: 2800,
      valid: true,
    },
    {
      id: 6,
      description: "Landscaping & Grounds",
      amount: 1750,
      valid: true,
    },
    {
      id: 7,
      description: "Facade Cleaning - External Window Wash",
      amount: 12000,
      valid: false, // This is the invalid item - excluded per Clause 23.1(b)
    },
    {
      id: 8,
      description: "Fire Safety Systems Inspection",
      amount: 8000,
      valid: true,
    },
  ],
};
