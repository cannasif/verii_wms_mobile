import { apiClient } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import i18n from '@/locales';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/paged';
import type {
  AutoPackageFromSourceRequestDto,
  AutoPackageFromSourceResultDto,
  CreatePHeaderDto,
  CreatePLineDto,
  CreatePPackageDto,
  PHeaderDto,
  PLineDto,
  PPackageDto,
} from '../packaging-types';
import type {
  MobilePackageHeaderItem,
  MobilePackageItem,
  MobilePackageTreeNode,
  MovePackagesToSourceHeaderDto,
  PackageMoveResultDto,
} from '../types';

function requireApiData<T>(body: ApiResponse<T>, fallbackMessage: string): T {
  if (!body.success) {
    throw new Error((body.message || body.exceptionMessage || '').trim() || fallbackMessage);
  }
  if (typeof body.statusCode === 'number' && body.statusCode >= 400) {
    throw new Error((body.message || body.exceptionMessage || '').trim() || fallbackMessage);
  }
  const data = body.data;
  if (data === null || data === undefined) {
    throw new Error((body.message || body.exceptionMessage || '').trim() || fallbackMessage);
  }
  return data;
}

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

  /**
   * Lists packages (paged). For stock-scoped label printing, filters by `StockId` + `Equals` if the API supports it.
   * If the backend uses another column name, adjust the filter in the caller.
   */
  async getPackagesPaged(params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<MobilePackageItem>> {
    const response = await apiClient.post<ApiResponse<PagedResponse<MobilePackageItem>>>(
      '/api/PPackage/paged',
      buildPagedRequest(params, {
        pageNumber: 1,
        pageSize: 50,
        sortBy: 'PackageNo',
        sortDirection: 'asc',
      }),
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t('packageMobile.list.loadFailed'));
    }

    return (
      response.data.data ?? {
        data: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 20,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      }
    );
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

  async createPHeader(dto: CreatePHeaderDto, options?: ApiRequestOptions): Promise<PHeaderDto> {
    const response = await apiClient.post<ApiResponse<PHeaderDto>>('/api/PHeader', dto, options);
    return requireApiData(response.data, i18n.t('packageMobile.create.errors.headerCreate'));
  },

  async createPPackage(dto: CreatePPackageDto, options?: ApiRequestOptions): Promise<PPackageDto> {
    const response = await apiClient.post<ApiResponse<PPackageDto>>('/api/PPackage', dto, options);
    return requireApiData(response.data, i18n.t('packageMobile.create.errors.packageCreate'));
  },

  async createPLine(dto: CreatePLineDto, options?: ApiRequestOptions): Promise<PLineDto> {
    const response = await apiClient.post<ApiResponse<PLineDto>>('/api/PLine', dto, options);
    return requireApiData(response.data, i18n.t('packageMobile.create.errors.lineCreate'));
  },

  async autoPackageFromSource(
    dto: AutoPackageFromSourceRequestDto,
    options?: ApiRequestOptions,
  ): Promise<AutoPackageFromSourceResultDto> {
    const response = await apiClient.post<ApiResponse<AutoPackageFromSourceResultDto>>(
      '/api/PackageOperations/auto-package-from-source',
      dto,
      options,
    );
    return requireApiData(response.data, i18n.t('packageMobile.create.errors.autoPackage'));
  },

  async getPackagesByHeader(packingHeaderId: number, options?: ApiRequestOptions): Promise<MobilePackageItem[]> {
    const response = await apiClient.get<ApiResponse<MobilePackageItem[]>>(
      `/api/PPackage/header/${packingHeaderId}`,
      options,
    );
    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t('packageMobile.create.errors.packagesByHeader'));
    }
    return response.data.data ?? [];
  },

  async getPLinesByPackage(packageId: number, options?: ApiRequestOptions): Promise<PLineDto[]> {
    const response = await apiClient.get<ApiResponse<PLineDto[]>>(`/api/PLine/package/${packageId}`, options);
    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t('packageMobile.create.errors.linesByPackage'));
    }
    return response.data.data ?? [];
  },

  async getPLinesByHeader(packingHeaderId: number, options?: ApiRequestOptions): Promise<PLineDto[]> {
    const response = await apiClient.get<ApiResponse<PLineDto[]>>(`/api/PLine/header/${packingHeaderId}`, options);
    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t('packageMobile.create.errors.linesByHeader'));
    }
    return response.data.data ?? [];
  },
};
