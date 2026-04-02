import { apiClient } from '@/lib/axios';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse } from '@/types/paged';
import type {
  CollectionApi,
  CollectionCollectedItem,
  CollectionLine,
  CollectionStockBarcode,
} from '@/features/shared-collection/types';

export function createSubcontractingCollectionApi(kind: 'issue' | 'receipt'): CollectionApi {
  const prefix = kind === 'issue' ? 'Sit' : 'Srt';

  return {
    async getAssignedOrderLines(headerId: number, options?: ApiRequestOptions): Promise<{ lines: CollectionLine[] }> {
      const response = await apiClient.get<ApiResponse<{ lines: CollectionLine[] }>>(`/api/${prefix}Header/getAssignedOrderLines/${headerId}`, options);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Atanmış fason satırları alınamadı.');
      }
      return response.data.data;
    },

    async getStokBarcode(barcode: string, barcodeGroup: string = '1', options?: ApiRequestOptions): Promise<CollectionStockBarcode[]> {
      const response = await apiClient.get<ApiResponse<CollectionStockBarcode[]>>('/api/Erp/getStokBarcode', {
        params: { bar: barcode, barkodGrubu: barcodeGroup },
        ...options,
      });
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Barkod bilgisi alınamadı.');
      }
      return response.data.data;
    },

    async addBarcodeToOrder(request) {
      const response = await apiClient.post<ApiResponse<unknown>>(`/api/${prefix}ImportLine/addBarcodeBasedonAssignedOrder`, request);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Fason toplama başarısız oldu.');
      }
    },

    async getCollectedBarcodes(headerId: number, options?: ApiRequestOptions): Promise<CollectionCollectedItem[]> {
      const response = await apiClient.get<ApiResponse<CollectionCollectedItem[]>>(`/api/${prefix}ImportLine/warehouseShipmentOrderCollectedBarcodes/${headerId}`, options);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Toplanan fason barkodları alınamadı.');
      }
      return response.data.data;
    },

    async complete(headerId: number): Promise<void> {
      const response = await apiClient.post<ApiResponse<unknown>>(`/api/${prefix}Header/complete/${headerId}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Fason tamamlama başarısız oldu.');
      }
    },
  };
}
