"use client";

import { useSearchParams } from "next/navigation";

export function useAIMode(): "mock" | "live" {
  const searchParams = useSearchParams();
  return searchParams.get("live") === "true" ? "live" : "mock";
}
