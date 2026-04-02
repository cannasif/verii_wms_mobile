type DiagnosticStatus = 'request' | 'response' | 'error';

export interface RequestDiagnosticEntry {
  id: string;
  status: DiagnosticStatus;
  timestamp: string;
  method?: string;
  url: string;
  statusCode?: number;
  durationMs?: number;
  message?: string;
}

const MAX_ENTRIES = 100;
const entries: RequestDiagnosticEntry[] = [];

function push(entry: RequestDiagnosticEntry): void {
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }
}

export function createRequestDiagnosticId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addRequestDiagnostic(entry: RequestDiagnosticEntry): void {
  push(entry);
}

export function getRecentRequestDiagnostics(): RequestDiagnosticEntry[] {
  return [...entries];
}
