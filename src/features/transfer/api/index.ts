import { apiClient } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import i18n from '@/locales';
import type { PagedParams, PagedResponse } from '@/types/paged';
import type { TransferAssignedHeader } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  exceptionMessage: string;
  data: T;
  errors: string[];
  timestamp: string;
  statusCode: number;
  className: string;
}

export const transferApi = {
  async getAssignedHeaders(userId: number, params: PagedParams = {}): Promise<PagedResponse<TransferAssignedHeader>> {
    const requestBody = buildPagedRequest(params, {
      pageNumber: 0,
      pageSize: 10,
      sortBy: 'Id',
      sortDirection: 'desc',
    });

    const response = await apiClient.post<ApiResponse<PagedResponse<TransferAssignedHeader>>>(
      `/api/WtHeader/assigned/${userId}/paged`,
      requestBody,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t('screens.transfer.loadFailed'));
    }

    return response.data.data;
  },
};
