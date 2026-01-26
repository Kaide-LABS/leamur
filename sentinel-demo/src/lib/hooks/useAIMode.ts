"use client";

import { useSearchParams } from "next/navigation";

export function useAIMode(): "mock" | "live" {
  const searchParams = useSearchParams();
  // Default to live mode, use ?mock=true to switch to mock
  return searchParams.get("mock") === "true" ? "mock" : "live";
}
