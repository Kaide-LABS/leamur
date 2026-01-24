"use client";

import { useReducer, useCallback } from "react";
import type { RadarState, RadarAction, PortfolioAnalysis } from "@/lib/types-radar";

const initialState: RadarState = {
  appState: "IDLE",
  selectedFiles: [],
  loadingStatus: "Initializing...",
  portfolioAnalysis: null,
  highlightedLeaseId: null,
  highlightedInsightId: null,
  isReasoningExpanded: false,
};

function radarReducer(state: RadarState, action: RadarAction): RadarState {
  switch (action.type) {
    case "UPLOAD_FILES":
      return {
        ...state,
        selectedFiles: action.payload,
      };

    case "REMOVE_FILE":
      return {
        ...state,
        selectedFiles: state.selectedFiles.filter(
          (f) => f.name !== action.payload
        ),
      };

    case "START_ANALYSIS":
      return {
        ...state,
        appState: "PROCESSING",
        portfolioAnalysis: null,
        highlightedLeaseId: null,
        highlightedInsightId: null,
        isReasoningExpanded: false,
      };

    case "UPDATE_LOADING_STATUS":
      return {
        ...state,
        loadingStatus: action.payload,
      };

    case "ANALYSIS_COMPLETE":
      return {
        ...state,
        appState: "RESULTS",
        portfolioAnalysis: action.payload,
      };

    case "SET_HIGHLIGHTED_LEASE":
      return {
        ...state,
        highlightedLeaseId: action.payload,
      };

    case "SET_HIGHLIGHTED_INSIGHT":
      return {
        ...state,
        highlightedInsightId: action.payload,
        // When highlighting an insight, also highlight its affected leases
        highlightedLeaseId: action.payload
          ? state.portfolioAnalysis?.insights.find(
              (i) => i.id === action.payload
            )?.affectedLeases[0] ?? null
          : null,
      };

    case "TOGGLE_REASONING":
      return {
        ...state,
        isReasoningExpanded: !state.isReasoningExpanded,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function useRadarReducer() {
  const [state, dispatch] = useReducer(radarReducer, initialState);

  // Action creators
  const uploadFiles = useCallback((files: File[]) => {
    dispatch({ type: "UPLOAD_FILES", payload: files });
  }, []);

  const removeFile = useCallback((filename: string) => {
    dispatch({ type: "REMOVE_FILE", payload: filename });
  }, []);

  const startAnalysis = useCallback(() => {
    dispatch({ type: "START_ANALYSIS" });
  }, []);

  const updateLoadingStatus = useCallback((status: string) => {
    dispatch({ type: "UPDATE_LOADING_STATUS", payload: status });
  }, []);

  const completeAnalysis = useCallback((result: PortfolioAnalysis) => {
    dispatch({ type: "ANALYSIS_COMPLETE", payload: result });
  }, []);

  const setHighlightedLease = useCallback((id: string | null) => {
    dispatch({ type: "SET_HIGHLIGHTED_LEASE", payload: id });
  }, []);

  const setHighlightedInsight = useCallback((id: string | null) => {
    dispatch({ type: "SET_HIGHLIGHTED_INSIGHT", payload: id });
  }, []);

  const toggleReasoning = useCallback(() => {
    dispatch({ type: "TOGGLE_REASONING" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    actions: {
      uploadFiles,
      removeFile,
      startAnalysis,
      updateLoadingStatus,
      completeAnalysis,
      setHighlightedLease,
      setHighlightedInsight,
      toggleReasoning,
      reset,
    },
  };
}
