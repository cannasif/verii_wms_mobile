import type { AppError } from '@/lib/errors';
import type { BarcodeMatchCandidate } from '@/services/barcode-types';

export interface BarcodeFeedbackState {
  message: string;
  candidates: BarcodeMatchCandidate[];
  errorCode?: string;
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
  const payload = error.details;
  const source = payload && typeof payload === 'object' ? (payload as { errorCode?: string }) : undefined;

  return {
    message: error.message,
    candidates: extractCandidates(payload),
    errorCode: source?.errorCode,
  };
}

export function getBarcodeCandidateLabel(candidate: BarcodeMatchCandidate): string {
  const stock = candidate.stockCode ?? '?';
  const name = candidate.stockName ? ` - ${candidate.stockName}` : '';
  const yap = candidate.yapKod ? ` (${candidate.yapKod})` : '';
  return `${stock}${name}${yap}`;
}
