import { apiClient } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import i18n from '@/locales';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/paged';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type {
  WorkflowAssignedItem,
  WorkflowHeaderDetail,
  WorkflowImportLineDetail,
  WorkflowLineDetail,
  WorkflowLineSerialDetail,
  WorkflowModuleKey,
  WorkflowRouteDetail,
  WorkflowTerminalLineDetail,
} from '../types/workflow';
import { getWorkflowModule } from '../config/workflow-modules';

function getModuleOrThrow(moduleKey: WorkflowModuleKey) {
  const module = getWorkflowModule(moduleKey);
  if (!module) {
    throw new Error(i18n.t('workflow.invalidModule'));
  }

  return module;
}

export const workflowApi = {
  async getAssignedHeaders(
    moduleKey: WorkflowModuleKey,
    userId: number,
    params: PagedParams = {},
    options?: ApiRequestOptions,
  ): Promise<PagedResponse<WorkflowAssignedItem>> {
    const module = getModuleOrThrow(moduleKey);

    const requestBody = buildPagedRequest(params, {
      pageNumber: 1,
      pageSize: 20,
      sortBy: 'Id',
      sortDirection: 'desc',
    });

    const response = await apiClient.post<ApiResponse<PagedResponse<WorkflowAssignedItem>>>(
      `${module.assignedEndpoint}/${userId}/paged`,
      requestBody,
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t(module.loadFailedKey));
    }

    return response.data.data;
  },

  async getHeaders(
    moduleKey: WorkflowModuleKey,
    params: PagedParams = {},
    options?: ApiRequestOptions,
  ): Promise<PagedResponse<WorkflowAssignedItem>> {
    const module = getModuleOrThrow(moduleKey);

    const requestBody = buildPagedRequest(params, {
      pageNumber: 1,
      pageSize: 20,
      sortBy: 'Id',
      sortDirection: 'desc',
    });

    const response = await apiClient.post<ApiResponse<PagedResponse<WorkflowAssignedItem>>>(
      `${module.listEndpoint}/paged`,
      requestBody,
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t(module.loadFailedKey));
    }

    return response.data.data;
  },

  async getApprovalHeaders(
    moduleKey: WorkflowModuleKey,
    params: PagedParams = {},
    options?: ApiRequestOptions,
  ): Promise<PagedResponse<WorkflowAssignedItem>> {
    const module = getModuleOrThrow(moduleKey);

    const requestBody = buildPagedRequest(params, {
      pageNumber: 1,
      pageSize: 20,
      sortBy: 'Id',
      sortDirection: 'desc',
    });

    const response = await apiClient.post<ApiResponse<PagedResponse<WorkflowAssignedItem>>>(
      module.approvalListEndpoint,
      requestBody,
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t(module.approvalLoadFailedKey));
    }

    return response.data.data;
  },

  async approveHeader(
    moduleKey: WorkflowModuleKey,
    headerId: number,
    approved: boolean,
    options?: ApiRequestOptions,
  ): Promise<void> {
    const module = getModuleOrThrow(moduleKey);

    const response = await apiClient.post<ApiResponse<unknown>>(
      `${module.approvalActionEndpoint}/${headerId}`,
      null,
      {
        ...options,
        params: { approved, id: headerId },
      },
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t(module.approvalLoadFailedKey));
    }
  },

  async getHeaderDetail(
    moduleKey: WorkflowModuleKey,
    headerId: number,
    options?: ApiRequestOptions,
  ): Promise<WorkflowHeaderDetail> {
    const module = getModuleOrThrow(moduleKey);

    const response = await apiClient.get<ApiResponse<WorkflowHeaderDetail>>(
      `${module.listEndpoint}/${headerId}`,
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t(module.loadFailedKey));
    }

    return response.data.data;
  },



  async getHeaderLines(
    moduleKey: WorkflowModuleKey,
    headerId: number,
    options?: ApiRequestOptions,
  ): Promise<WorkflowLineDetail[]> {
    const module = getModuleOrThrow(moduleKey);

    const requestBody = buildPagedRequest(
      { pageNumber: 1, pageSize: 1000 },
      {
        pageNumber: 1,
        pageSize: 1000,
        sortBy: 'Id',
        sortDirection: 'desc',
      },
    );

    const response = await apiClient.post<ApiResponse<PagedResponse<WorkflowLineDetail>>>(
      `${module.lineEndpoint}/by-header/${headerId}/paged`,
      requestBody,
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t(module.loadFailedKey));
    }

    return response.data.data?.data ?? [];
  },

  async getLineSerials(
    moduleKey: WorkflowModuleKey,
    lineId: number,
    options?: ApiRequestOptions,
  ): Promise<WorkflowLineSerialDetail[]> {
    const module = getModuleOrThrow(moduleKey);

    const response = await apiClient.get<ApiResponse<WorkflowLineSerialDetail[]>>(
      `${module.lineSerialEndpoint}/by-line/${lineId}`,
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t(module.loadFailedKey));
    }

    return response.data.data ?? [];
  },

  async getRouteById(
    moduleKey: WorkflowModuleKey,
    routeId: number,
    options?: ApiRequestOptions,
  ): Promise<WorkflowRouteDetail> {
    const module = getModuleOrThrow(moduleKey);

    const response = await apiClient.get<ApiResponse<WorkflowRouteDetail>>(
      `${module.routeEndpoint}/${routeId}`,
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t(module.loadFailedKey));
    }

    return response.data.data;
  },

  async getTerminalLines(
    moduleKey: WorkflowModuleKey,
    headerId: number,
    options?: ApiRequestOptions,
  ): Promise<WorkflowTerminalLineDetail[]> {
    const module = getModuleOrThrow(moduleKey);

    const response = await apiClient.get<ApiResponse<WorkflowTerminalLineDetail[]>>(
      `${module.terminalLineEndpoint}/header/${headerId}`,
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t(module.loadFailedKey));
    }

    return response.data.data ?? [];
  },

  async getHeaderImportLines(
    moduleKey: WorkflowModuleKey,
    headerId: number,
    options?: ApiRequestOptions,
  ): Promise<WorkflowImportLineDetail[]> {
    const module = getModuleOrThrow(moduleKey);

    const response = await apiClient.get<ApiResponse<WorkflowImportLineDetail[]>>(
      `${module.importLineEndpoint}/by-header/${headerId}`,
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || i18n.t(module.loadFailedKey));
    }

    return response.data.data ?? [];
  },
};
