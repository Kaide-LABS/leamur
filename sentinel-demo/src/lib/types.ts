export interface LineItem {
  id: number;
  description: string;
  amount: number;
  valid: boolean;
}

export interface Invoice {
  id: string;
  property: string;
  period: string;
  landlord: string;
  totalAmount: number;
  lineItems: LineItem[];
}

export interface LeaseClause {
  clauseNumber: string;
  title: string;
  text: string;
  relevantParagraph: string;
}

export interface LogEntry {
  timestamp: string;
  service: 'OCR-SERVICE' | 'VECTOR-DB' | 'LEASE-RETRIEVAL' | 'AUDIT-ENGINE';
  message: string;
  metrics?: string;
  delay: number;
}

export interface ReasoningStep {
  step: number;
  action: 'CATEGORIZE' | 'RETRIEVE' | 'ANALYZE' | 'COMPARE' | 'MATCH' | 'CONCLUDE';
  detail: string;
  confidence: number;
}

export interface AuditResult {
  anomalyDetected: boolean;
  flaggedItem: LineItem | null;
  clause: LeaseClause | null;
  reasoning: ReasoningStep[];
  savings: number;
}

export type AppState = 'IDLE' | 'PROCESSING' | 'RESULTS';

export type DemoAction =
  | { type: 'UPLOAD_FILE'; payload: File }
  | { type: 'START_ANALYSIS' }
  | { type: 'LOG_ENTRY'; payload: LogEntry }
  | { type: 'UPDATE_LOADING_STATUS'; payload: string }
  | { type: 'ANALYSIS_COMPLETE'; payload: AuditResult }
  | { type: 'SET_HIGHLIGHTED_ITEM'; payload: number | null }
  | { type: 'TOGGLE_REASONING' }
  | { type: 'OPEN_DISPUTE_MODAL' }
  | { type: 'CLOSE_DISPUTE_MODAL' }
  | { type: 'DISMISS_ANOMALY_ALERT' }
  | { type: 'RESET' };

export interface DemoState {
  appState: AppState;
  selectedFile: File | null;
  visibleLogs: LogEntry[];
  currentLogIndex: number;
  loadingStatus: string;
  auditResult: AuditResult | null;
  highlightedItemId: number | null;
  isAnomalyAlertVisible: boolean;
  isReasoningExpanded: boolean;
  isDisputeModalOpen: boolean;
  aiMode: 'mock' | 'live';
}

export interface TimelineDataPoint {
  date: string;
  savings: number;
  invoice: string;
}
