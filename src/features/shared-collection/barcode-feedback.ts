import type { AppError } from '@/lib/errors';
import type { BarcodeMatchCandidate } from '@/services/barcode-types';

export interface BarcodeFeedbackState {
  message: string;
  candidates: BarcodeMatchCandidate[];
  errorCode?: string;
}

function toObjectDetails(details: unknown): unknown {
  if (typeof details !== 'string') {
    return details;
  }
  const text = details.trim();
  if (!text) {
    return details;
  }
  if (!(text.startsWith('{') || text.startsWith('['))) {
    return details;
  }
  try {
    return JSON.parse(text);
  } catch {
    return details;
  }
}

function extractErrorCode(details: unknown): string | undefined {
  if (!details || typeof details !== 'object') {
    return undefined;
  }

  const source = details as {
    errorCode?: unknown;
    data?: { errorCode?: unknown };
    details?: { errorCode?: unknown };
  };

  const candidates = [source.errorCode, source.data?.errorCode, source.details?.errorCode];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }
  return undefined;
}

function extractCandidates(details: unknown): BarcodeMatchCandidate[] {
  if (!details || typeof details !== 'object') {
    return [];
  }

  const source = details as {
    candidates?: BarcodeMatchCandidate[];
    data?: { candidates?: BarcodeMatchCandidate[] };
    details?: { candidates?: BarcodeMatchCandidate[] };
  };

  if (Array.isArray(source.candidates)) {
    return source.candidates;
  }

  if (Array.isArray(source.data?.candidates)) {
    return source.data.candidates;
  }

  if (Array.isArray(source.details?.candidates)) {
    return source.details.candidates;
  }

  return [];
}

export function extractBarcodeFeedback(error: AppError): BarcodeFeedbackState {
  const payload = toObjectDetails(error.details);

  return {
    message: error.message,
    candidates: extractCandidates(payload),
    errorCode: extractErrorCode(payload),
  };
}

export function getBarcodeCandidateLabel(candidate: BarcodeMatchCandidate): string {
  const stock = candidate.stockCode ?? '?';
  const name = candidate.stockName ? ` - ${candidate.stockName}` : '';
  const yap = candidate.yapKod ? ` (${candidate.yapKod})` : '';
  return `${stock}${name}${yap}`;
}
