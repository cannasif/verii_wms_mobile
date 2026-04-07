import { apiClient } from '@/lib/axios';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse } from '@/types/paged';
import { barcodeApi, toLegacyBarcodeStock } from '@/services/barcode-api';
import type {
  AddBarcodeRequest,
  AssignedTransferOrderLinesData,
  CollectedBarcodeItem,
  StokBarcodeDto,
} from '../types';

export const transferCollectionApi = {
  async getAssignedOrderLines(headerId: number, options?: ApiRequestOptions): Promise<AssignedTransferOrderLinesData> {
    const response = await apiClient.get<ApiResponse<AssignedTransferOrderLinesData>>(`/api/WtHeader/getAssignedTransferOrderLines/${headerId}`, options);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Atanmış transfer satırları alınamadı.');
    }
    return response.data.data;
  },

  async getStokBarcode(barcode: string, options?: ApiRequestOptions): Promise<StokBarcodeDto[]> {
    const resolved = await barcodeApi.resolve('warehouse-transfer-assigned', barcode, options);
    return [toLegacyBarcodeStock(resolved)];
  },

  async addBarcodeToOrder(request: AddBarcodeRequest): Promise<void> {
    const response = await apiClient.post<ApiResponse<unknown>>('/api/WtImportLine/addBarcodeBasedonAssignedOrder', request);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Transfer toplama başarısız oldu.');
    }
  },

  async getCollectedBarcodes(headerId: number, options?: ApiRequestOptions): Promise<CollectedBarcodeItem[]> {
    const response = await apiClient.get<ApiResponse<CollectedBarcodeItem[]>>(`/api/WtImportLine/warehouseTransferOrderCollectedBarcodes/${headerId}`, options);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Toplanan transfer barkodları alınamadı.');
    }
    return response.data.data;
  },

  async complete(headerId: number): Promise<void> {
    const response = await apiClient.post<ApiResponse<unknown>>(`/api/WtHeader/complete/${headerId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Transfer tamamlama başarısız oldu.');
    }
  },


  async getBarcodeDefinition(options?: ApiRequestOptions) {
    return await barcodeApi.getDefinition('warehouse-transfer-assigned', options);
  },
};
