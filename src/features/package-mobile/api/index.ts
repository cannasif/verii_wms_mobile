import { apiClient } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import i18n from '@/locales';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/paged';
import type {
  MobilePackageHeaderItem,
  MobilePackageTreeNode,
  MovePackagesToSourceHeaderDto,
  PackageMoveResultDto,
} from '../types';

export const packageMobileApi = {
  async getHeaders(
    params: PagedParams = {},
    options?: ApiRequestOptions,
  ): Promise<PagedResponse<MobilePackageHeaderItem>> {
    const response = await apiClient.post<ApiResponse<PagedResponse<MobilePackageHeaderItem>>>(
      '/api/PHeader/paged',
      buildPagedRequest(params, {
        pageNumber: 1,
        pageSize: 20,
        sortBy: 'Id',
        sortDirection: 'desc',
      }),
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t('packageMobile.list.loadFailed'));
    }

    return response.data.data;
  },

  async getHeaderById(
    id: number,
    options?: ApiRequestOptions,
  ): Promise<MobilePackageHeaderItem> {
    const response = await apiClient.get<ApiResponse<MobilePackageHeaderItem>>(`/api/PHeader/${id}`, options);

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t('packageMobile.detail.loadFailed'));
    }

    return response.data.data;
  },

  async getPackageTree(
    packingHeaderId: number,
    options?: ApiRequestOptions,
  ): Promise<MobilePackageTreeNode[]> {
    const response = await apiClient.get<ApiResponse<MobilePackageTreeNode[]>>(
      `/api/PPackage/header/${packingHeaderId}/tree`,
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t('packageMobile.detail.loadFailed'));
    }

    return response.data.data ?? [];
  },

  async movePackagesToSourceHeader(
    payload: MovePackagesToSourceHeaderDto,
    options?: ApiRequestOptions,
  ): Promise<PackageMoveResultDto> {
    const response = await apiClient.post<ApiResponse<PackageMoveResultDto>>(
      '/api/PackageOperations/move-to-source-header',
      payload,
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t('packageMoveMobile.moveFailed'));
    }

    return response.data.data;
  },
};
