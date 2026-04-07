import { apiClient } from '@/lib/axios';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse } from '@/types/paged';
import { barcodeApi, toLegacyBarcodeStock } from '@/services/barcode-api';
import type {
  CollectionApi,
  CollectionCollectedItem,
  CollectionLine,
  CollectionStockBarcode,
} from '@/features/shared-collection/types';

export const shipmentCollectionApi: CollectionApi = {
  async getAssignedOrderLines(headerId: number, options?: ApiRequestOptions): Promise<{ lines: CollectionLine[] }> {
    const response = await apiClient.get<ApiResponse<{ lines: CollectionLine[] }>>(`/api/ShHeader/assigned-lines/${headerId}`, options);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Atanmış sevkiyat satırları alınamadı.');
    }
    return response.data.data;
  },

  async getStokBarcode(barcode: string, options?: ApiRequestOptions): Promise<CollectionStockBarcode[]> {
    const resolved = await barcodeApi.resolve('shipping-assigned', barcode, options);
    return [toLegacyBarcodeStock(resolved)];
  },

  async addBarcodeToOrder(request) {
    const response = await apiClient.post<ApiResponse<unknown>>('/api/ShImportLine/addBarcodeBasedonAssignedOrder', request);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Sevkiyat toplama başarısız oldu.');
    }
  },

  async getCollectedBarcodes(headerId: number, options?: ApiRequestOptions): Promise<CollectionCollectedItem[]> {
    const response = await apiClient.get<ApiResponse<CollectionCollectedItem[]>>(`/api/ShImportLine/warehouseShipmentOrderCollectedBarcodes/${headerId}`, options);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Toplanan sevkiyat barkodları alınamadı.');
    }
    return response.data.data;
  },

  async complete(headerId: number): Promise<void> {
    const response = await apiClient.post<ApiResponse<unknown>>(`/api/ShHeader/complete/${headerId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Sevkiyat tamamlama başarısız oldu.');
    }
  },


  async getBarcodeDefinition(options?: ApiRequestOptions) {
    return await barcodeApi.getDefinition('shipping-assigned', options);
  },
};
