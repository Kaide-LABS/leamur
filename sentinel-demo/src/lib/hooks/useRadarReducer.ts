"use client";

import { useReducer, useCallback, useMemo } from "react";
import type { RadarState, RadarAction, PortfolioAnalysis } from "@/lib/types-radar";
import type { ExtractionProgress, LeaseExtraction, ValidationReport } from "@/lib/types-extraction";

const initialState: RadarState = {
  appState: "IDLE",
  selectedFiles: [],
  loadingStatus: "Initializing...",
  portfolioAnalysis: null,
  highlightedLeaseId: null,
  highlightedInsightId: null,
  isReasoningExpanded: false,
  extractionProgress: null,
  validationReport: null,
  analysisError: null,
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
        extractionProgress: null,
        analysisError: null,
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

    // Map-Reduce actions
    case "UPDATE_EXTRACTION_PROGRESS":
      return {
        ...state,
        extractionProgress: action.payload,
        loadingStatus: action.payload.phase === 'extracting'
          ? `Extracting lease ${action.payload.completed_files + 1} of ${action.payload.total_files}...`
          : action.payload.phase === 'synthesizing'
          ? 'Synthesizing portfolio analysis...'
          : state.loadingStatus,
      };

    case "EXTRACTION_COMPLETE":
      return {
        ...state,
        extractionProgress: state.extractionProgress
          ? {
              ...state.extractionProgress,
              phase: 'complete',
              successful_extractions: action.payload,
            }
          : null,
      };

    case "VALIDATION_STARTED":
      return {
        ...state,
        loadingStatus: "Validating extractions with Claude Opus...",
        extractionProgress: state.extractionProgress
          ? { ...state.extractionProgress, phase: 'validating' }
          : null,
      };

    case "VALIDATION_COMPLETE":
      return {
        ...state,
        validationReport: action.payload.report,
        extractionProgress: state.extractionProgress
          ? {
              ...state.extractionProgress,
              successful_extractions: action.payload.correctedExtractions,
            }
          : null,
      };

    case "SYNTHESIS_STARTED":
      return {
        ...state,
        loadingStatus: "Synthesizing portfolio insights...",
        extractionProgress: state.extractionProgress
          ? { ...state.extractionProgress, phase: 'synthesizing' }
          : null,
      };

    case "ANALYSIS_ERROR":
      return {
        ...state,
        analysisError: action.payload.error,
        extractionProgress: state.extractionProgress
          ? {
              ...state.extractionProgress,
              phase: 'error',
              successful_extractions: action.payload.partialResults || [],
            }
          : null,
      };

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

  // Map-Reduce action creators
  const updateExtractionProgress = useCallback((progress: ExtractionProgress) => {
    dispatch({ type: "UPDATE_EXTRACTION_PROGRESS", payload: progress });
  }, []);

  const extractionComplete = useCallback((extractions: LeaseExtraction[]) => {
    dispatch({ type: "EXTRACTION_COMPLETE", payload: extractions });
  }, []);

  const validationStarted = useCallback(() => {
    dispatch({ type: "VALIDATION_STARTED" });
  }, []);

  const validationComplete = useCallback(
    (payload: { correctedExtractions: LeaseExtraction[]; report: ValidationReport | null }) => {
      dispatch({ type: "VALIDATION_COMPLETE", payload });
    },
    []
  );

  const synthesisStarted = useCallback(() => {
    dispatch({ type: "SYNTHESIS_STARTED" });
  }, []);

  const analysisError = useCallback((error: string, partialResults?: LeaseExtraction[]) => {
    dispatch({ type: "ANALYSIS_ERROR", payload: { error, partialResults } });
  }, []);

  // Memoize actions object to prevent infinite loops in useEffect dependencies
  const actions = useMemo(
    () => ({
      uploadFiles,
      removeFile,
      startAnalysis,
      updateLoadingStatus,
      completeAnalysis,
      setHighlightedLease,
      setHighlightedInsight,
      toggleReasoning,
      reset,
      // Map-Reduce actions
      updateExtractionProgress,
      extractionComplete,
      validationStarted,
      validationComplete,
      synthesisStarted,
      analysisError,
    }),
    [
      uploadFiles,
      removeFile,
      startAnalysis,
      updateLoadingStatus,
      completeAnalysis,
      setHighlightedLease,
      setHighlightedInsight,
      toggleReasoning,
      reset,
      updateExtractionProgress,
      extractionComplete,
      validationStarted,
      validationComplete,
      synthesisStarted,
      analysisError,
    ]
  );

  return {
    state,
    actions,
  };
}
