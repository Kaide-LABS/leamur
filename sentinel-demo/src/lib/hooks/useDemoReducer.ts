"use client";

import { useReducer, useCallback } from "react";
import type { DemoState, DemoAction, LogEntry, AuditResult } from "@/lib/types";

const initialState: DemoState = {
  appState: "IDLE",
  selectedFile: null,
  visibleLogs: [],
  currentLogIndex: 0,
  loadingStatus: "Initializing...",
  auditResult: null,
  highlightedItemId: null,
  isAnomalyAlertVisible: false,
  isReasoningExpanded: false,
  isDisputeModalOpen: false,
  aiMode: "mock",
};

function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "UPLOAD_FILE":
      return {
        ...state,
        selectedFile: action.payload,
      };

    case "START_ANALYSIS":
      return {
        ...state,
        appState: "PROCESSING",
        visibleLogs: [],
        currentLogIndex: 0,
        auditResult: null,
        highlightedItemId: null,
        isAnomalyAlertVisible: false,
        isReasoningExpanded: false,
      };

    case "LOG_ENTRY":
      return {
        ...state,
        visibleLogs: [...state.visibleLogs, action.payload],
        currentLogIndex: state.currentLogIndex + 1,
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
        auditResult: action.payload,
        highlightedItemId: action.payload.flaggedItem?.id ?? null,
        isAnomalyAlertVisible: action.payload.anomalyDetected,
      };

    case "SET_HIGHLIGHTED_ITEM":
      return {
        ...state,
        highlightedItemId: action.payload,
      };

    case "TOGGLE_REASONING":
      return {
        ...state,
        isReasoningExpanded: !state.isReasoningExpanded,
      };

    case "OPEN_DISPUTE_MODAL":
      return {
        ...state,
        isDisputeModalOpen: true,
      };

    case "CLOSE_DISPUTE_MODAL":
      return {
        ...state,
        isDisputeModalOpen: false,
      };

    case "DISMISS_ANOMALY_ALERT":
      return {
        ...state,
        isAnomalyAlertVisible: false,
      };

    case "RESET":
      return {
        ...initialState,
        aiMode: state.aiMode, // Preserve AI mode across resets
      };

    default:
      return state;
  }
}

export function useDemoReducer(mode: "mock" | "live" = "mock") {
  const [state, dispatch] = useReducer(demoReducer, {
    ...initialState,
    aiMode: mode,
  });

  // Action creators
  const uploadFile = useCallback((file: File) => {
    dispatch({ type: "UPLOAD_FILE", payload: file });
  }, []);

  const startAnalysis = useCallback(() => {
    dispatch({ type: "START_ANALYSIS" });
  }, []);

  const addLogEntry = useCallback((log: LogEntry) => {
    dispatch({ type: "LOG_ENTRY", payload: log });
  }, []);

  const updateLoadingStatus = useCallback((status: string) => {
    dispatch({ type: "UPDATE_LOADING_STATUS", payload: status });
  }, []);

  const completeAnalysis = useCallback((result: AuditResult) => {
    dispatch({ type: "ANALYSIS_COMPLETE", payload: result });
  }, []);

  const setHighlightedItem = useCallback((id: number | null) => {
    dispatch({ type: "SET_HIGHLIGHTED_ITEM", payload: id });
  }, []);

  const toggleReasoning = useCallback(() => {
    dispatch({ type: "TOGGLE_REASONING" });
  }, []);

  const openDisputeModal = useCallback(() => {
    dispatch({ type: "OPEN_DISPUTE_MODAL" });
  }, []);

  const closeDisputeModal = useCallback(() => {
    dispatch({ type: "CLOSE_DISPUTE_MODAL" });
  }, []);

  const dismissAnomalyAlert = useCallback(() => {
    dispatch({ type: "DISMISS_ANOMALY_ALERT" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    actions: {
      uploadFile,
      startAnalysis,
      addLogEntry,
      updateLoadingStatus,
      completeAnalysis,
      setHighlightedItem,
      toggleReasoning,
      openDisputeModal,
      closeDisputeModal,
      dismissAnomalyAlert,
      reset,
    },
  };
}
