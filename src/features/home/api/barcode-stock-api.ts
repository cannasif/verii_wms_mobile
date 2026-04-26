import { apiClient } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse, PagedResponse } from '@/types/paged';
import { barcodeApi } from '@/services/barcode-api';
import type { BarcodeMatchCandidate } from '@/services/barcode-types';
import { AppError } from '@/lib/errors';
import { extractBarcodeFeedback } from '@/features/shared-collection/barcode-feedback';

export interface HomeStockRow {
  id: number;
  erpStockCode: string;
  stockName: string;
  unit?: string | null;
}

export interface HomeStockDetail {
  id: number;
  stockId: number;
  erpStockCode: string;
  stockName: string;
  htmlDescription?: string | null;
  technicalSpecsJson?: string | null;
}

export class BarcodeResolveError extends Error {
  errorCode?: string;
  candidates: BarcodeMatchCandidate[];

  constructor(message: string, errorCode?: string, candidates: BarcodeMatchCandidate[] = []) {
    super(message);
    this.name = 'BarcodeResolveError';
    this.errorCode = errorCode;
    this.candidates = candidates;
  }
}

function normalizeBarcodeErrorCode(errorCode?: string, message?: string): string | undefined {
  const normalized = (errorCode ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase();
  const directMap: Record<string, string> = {
    AMBIGUOUSMATCH: 'AmbiguousMatch',
    MULTIMATCH: 'AmbiguousMatch',
    NOMATCH: 'NoMatch',
    STOCKNOTFOUND: 'NoMatch',
    NOTFOUND: 'NoMatch',
    INVALIDBARCODEFORMAT: 'InvalidBarcodeFormat',
    INVALIDFORMAT: 'InvalidBarcodeFormat',
    MISSINGREQUIREDSEGMENT: 'MissingRequiredSegment',
    MISSINGSEGMENT: 'MissingRequiredSegment',
    DEFINITIONNOTFOUND: 'DefinitionNotFound',
    BARCODEDEFINITIONNOTFOUND: 'DefinitionNotFound',
    STOCKCODEEMPTY: 'StockCodeEmpty',
  };

  if (normalized && directMap[normalized]) {
    return directMap[normalized];
  }

  const lowerMessage = (message ?? '').toLowerCase();
  if (lowerMessage.includes('ambiguous') || lowerMessage.includes('multiple')) {
    return 'AmbiguousMatch';
  }
  if (
    lowerMessage.includes('no match') ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('stok bulunamad') ||
    lowerMessage.includes('eslesme yok') ||
    lowerMessage.includes('eşleşme yok')
  ) {
    return 'NoMatch';
  }
  if (lowerMessage.includes('format')) {
    return 'InvalidBarcodeFormat';
  }
  if (lowerMessage.includes('segment')) {
    return 'MissingRequiredSegment';
  }
  if (lowerMessage.includes('definition')) {
    return 'DefinitionNotFound';
  }
  return errorCode;
}

export async function resolveBarcodeToStockCode(barcode: string, options?: ApiRequestOptions): Promise<string> {
  try {
    const resolved = await barcodeApi.resolve('product-lookup', barcode, options);
    const stockCode = resolved.stockCode?.trim();
    if (!stockCode) {
      throw new BarcodeResolveError('Stock code is empty', 'STOCK_CODE_EMPTY');
    }
    return stockCode;
  } catch (error) {
    if (error instanceof BarcodeResolveError) {
      throw error;
    }

    if (error instanceof AppError) {
      const feedback = extractBarcodeFeedback(error);
      throw new BarcodeResolveError(
        feedback.message,
        normalizeBarcodeErrorCode(feedback.errorCode, feedback.message),
        feedback.candidates,
      );
    }

    const message = error instanceof Error ? error.message : 'Barkod çözümlenemedi.';
    throw new BarcodeResolveError(message, normalizeBarcodeErrorCode(undefined, message), []);
  }
}

export async function findStocksByCode(stockCode: string, options?: ApiRequestOptions): Promise<HomeStockRow[]> {
  const response = await apiClient.post<ApiResponse<PagedResponse<HomeStockRow>>>(
    '/api/Stock/paged',
    buildPagedRequest(
      {
        pageNumber: 1,
        pageSize: 20,
        search: '',
        filterLogic: 'and',
        filters: [{ column: 'ErpStockCode', operator: 'Equals', value: stockCode }],
      },
      {
        pageNumber: 1,
        pageSize: 20,
        sortBy: 'Id',
        sortDirection: 'desc',
      },
    ),
    options,
  );

  if (!response.data.success || !response.data.data) {
    return [];
  }

  const normalized = stockCode.trim().toUpperCase();
  return (response.data.data.data ?? []).filter((item) => (item.erpStockCode ?? '').trim().toUpperCase() === normalized);
}

export async function getStockDetail(stockId: number, options?: ApiRequestOptions): Promise<HomeStockDetail | null> {
  const response = await apiClient.get<ApiResponse<HomeStockDetail | null>>(`/api/StockDetail/stock/${stockId}`, options);
  if (!response.data.success) {
    return null;
  }
  return response.data.data ?? null;
}
