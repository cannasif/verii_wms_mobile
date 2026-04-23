import { apiClient } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import i18n from '@/locales';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/paged';
import type { WarehouseStockBalanceItem, WarehouseStockSerialBalanceItem } from '../types';

export const warehouseBalanceApi = {
  async getStockBalances(
    params: PagedParams = {},
    options?: ApiRequestOptions,
  ): Promise<PagedResponse<WarehouseStockBalanceItem>> {
    const response = await apiClient.post<ApiResponse<PagedResponse<WarehouseStockBalanceItem>>>(
      '/api/WarehouseBalance/stock-paged',
      buildPagedRequest(params, {
        pageNumber: 1,
        pageSize: 20,
        sortBy: 'Id',
        sortDirection: 'desc',
      }),
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t('inventoryMobile.stock.loadFailed'));
    }

    return response.data.data;
  },

  async getSerialBalances(
    params: PagedParams = {},
    options?: ApiRequestOptions,
  ): Promise<PagedResponse<WarehouseStockSerialBalanceItem>> {
    const response = await apiClient.post<ApiResponse<PagedResponse<WarehouseStockSerialBalanceItem>>>(
      '/api/WarehouseBalance/serial-paged',
      buildPagedRequest(params, {
        pageNumber: 1,
        pageSize: 20,
        sortBy: 'Id',
        sortDirection: 'desc',
      }),
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t('inventoryMobile.serial.loadFailed'));
    }

    return response.data.data;
  },
};
