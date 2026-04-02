import { apiClient } from '@/lib/axios';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse } from '@/types/paged';
import type {
  AddBarcodeRequest,
  AssignedGrOrderLinesData,
  CollectedBarcodeItem,
  StokBarcodeDto,
} from '../types';

export const goodsReceiptCollectionApi = {
  async getAssignedOrderLines(headerId: number, options?: ApiRequestOptions): Promise<AssignedGrOrderLinesData> {
    const response = await apiClient.get<ApiResponse<AssignedGrOrderLinesData>>(`/api/GrHeader/assigned-lines/${headerId}`, options);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Atanmış mal kabul satırları alınamadı.');
    }
    return response.data.data;
  },

  async getStokBarcode(barcode: string, barcodeGroup: string = '1', options?: ApiRequestOptions): Promise<StokBarcodeDto[]> {
    const response = await apiClient.get<ApiResponse<StokBarcodeDto[]>>('/api/Erp/getStokBarcode', {
      params: { bar: barcode, barkodGrubu: barcodeGroup },
      ...options,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Barkod bilgisi alınamadı.');
    }
    return response.data.data;
  },

  async addBarcodeToOrder(request: AddBarcodeRequest): Promise<void> {
    const response = await apiClient.post<ApiResponse<unknown>>('/api/GrImportLine/addBarcodeBasedonAssignedOrder', request);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Barkod toplama işlemi başarısız oldu.');
    }
  },

  async getCollectedBarcodes(headerId: number, options?: ApiRequestOptions): Promise<CollectedBarcodeItem[]> {
    const response = await apiClient.get<ApiResponse<CollectedBarcodeItem[]>>(`/api/GrImportLine/warehouseGoodsReceiptOrderCollectedBarcodes/${headerId}`, options);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Toplanan barkodlar alınamadı.');
    }
    return response.data.data;
  },

  async completeGoodsReceipt(headerId: number): Promise<void> {
    const response = await apiClient.post<ApiResponse<unknown>>(`/api/GrHeader/complete/${headerId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Mal kabul tamamlama başarısız oldu.');
    }
  },
};
