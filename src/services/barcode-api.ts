import { apiClient } from '@/lib/axios';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse } from '@/types/paged';
import type { BarcodeDefinition, ResolvedBarcode } from './barcode-types';
import { AppError } from '@/lib/errors';

export const barcodeApi = {
  async getDefinition(moduleKey: string, options?: ApiRequestOptions): Promise<BarcodeDefinition> {
    const response = await apiClient.get<ApiResponse<BarcodeDefinition>>(`/api/Barcode/definitions/${moduleKey}`, options);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Barkod tanımı alınamadı.');
    }
    return response.data.data;
  },

  async resolve(moduleKey: string, barcode: string, options?: ApiRequestOptions): Promise<ResolvedBarcode> {
    try {
      const response = await apiClient.post<ApiResponse<ResolvedBarcode>>('/api/Barcode/resolve', { moduleKey, barcode }, options);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Barkod çözümlenemedi.');
      }
      return response.data.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  },
};

export function toLegacyBarcodeStock(result: ResolvedBarcode) {
  return {
    barkod: result.barcode,
    stokKodu: result.stockCode ?? '',
    stokAdi: result.stockName ?? '',
    depoKodu: null,
    depoAdi: null,
    rafKodu: null,
    yapilandir: '',
    olcuBr: 0,
    olcuAdi: '',
    yapKod: result.yapKod ?? null,
    yapAcik: result.yapAcik ?? null,
    cevrim: 0,
    seriBarkodMu: Boolean(result.serialNumber),
    sktVarmi: null,
    isemriNo: null,
  };
}
