import type { AxiosResponse } from 'axios';
import { apiClient } from '@/lib/axios';
import { AppError } from '@/lib/errors';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse } from '@/types/paged';
import type {
  BarcodeDesignerPreviewRequest,
  BarcodeDesignerResolvePrintSourceRequest,
  BarcodeTemplateListItem,
  PackageLabelPrintRequest,
  PackageLabelPrintResult,
  PrinterDefinitionDto,
  PrinterProfileDto,
  PrintJobStatusDto,
  TemplatePrinterProfileDto,
} from '../types';

function joinMessages(body: ApiResponse<unknown>): string {
  const parts = [body.message, (body as { exceptionMessage?: string }).exceptionMessage].filter(
    (x): x is string => Boolean(x && String(x).trim()),
  );
  return parts.join(' — ') || 'Request failed';
}

function unwrapApiResponse<T>(response: AxiosResponse<ApiResponse<T>>, allowNullData = false): T {
  const body = response.data;
  if (!body.success) {
    throw new AppError({
      message: joinMessages(body),
      status: body.statusCode,
      details: body,
    });
  }
  if (!allowNullData && (body.data === undefined || body.data === null)) {
    throw new AppError({
      message: joinMessages(body) || 'No data',
      status: body.statusCode,
      details: body,
    });
  }
  return body.data as T;
}

export const labelPrintApi = {
  async getPrinters(options?: ApiRequestOptions): Promise<PrinterDefinitionDto[]> {
    const response = await apiClient.get<ApiResponse<PrinterDefinitionDto[]>>('/api/PrinterManagement/printers', options);
    const data = unwrapApiResponse(response, true);
    const list = data ?? [];
    return list.filter((p) => p.isActive !== false);
  },

  async getProfiles(printerDefinitionId: number, options?: ApiRequestOptions): Promise<PrinterProfileDto[]> {
    const response = await apiClient.get<ApiResponse<PrinterProfileDto[]>>('/api/PrinterManagement/profiles', {
      signal: options?.signal,
      params: { printerDefinitionId },
    });
    const data = unwrapApiResponse(response, true);
    const list = data ?? [];
    return list.filter((p) => p.isActive !== false);
  },

  async getTemplatePrinterProfiles(
    barcodeTemplateId: number,
    options?: ApiRequestOptions,
  ): Promise<TemplatePrinterProfileDto[]> {
    const response = await apiClient.get<ApiResponse<TemplatePrinterProfileDto[]>>(
      `/api/PrinterManagement/template-printer-profiles/${barcodeTemplateId}`,
      options,
    );
    const data = unwrapApiResponse(response, true);
    return data ?? [];
  },

  async getTemplates(options?: ApiRequestOptions): Promise<BarcodeTemplateListItem[]> {
    const response = await apiClient.get<ApiResponse<BarcodeTemplateListItem[]>>('/api/BarcodeDesigner/templates', options);
    const data = unwrapApiResponse(response, true);
    const list = data ?? [];
    return list.filter((t) => t.publishedVersionId != null);
  },

  async preview(payload: BarcodeDesignerPreviewRequest, options?: ApiRequestOptions): Promise<unknown> {
    const response = await apiClient.post<ApiResponse<unknown>>('/api/BarcodeDesigner/preview', payload, options);
    return unwrapApiResponse(response, true);
  },

  async resolvePrintSource(
    payload: BarcodeDesignerResolvePrintSourceRequest,
    options?: ApiRequestOptions,
  ): Promise<unknown> {
    const response = await apiClient.post<ApiResponse<unknown>>(
      '/api/BarcodeDesigner/resolve-print-source',
      payload,
      options,
    );
    return unwrapApiResponse(response, true);
  },

  async printLabels(payload: PackageLabelPrintRequest, options?: ApiRequestOptions): Promise<PackageLabelPrintResult> {
    const response = await apiClient.post<ApiResponse<PackageLabelPrintResult>>(
      '/api/PackageOperations/print-labels',
      payload,
      options,
    );
    return unwrapApiResponse(response, true) as PackageLabelPrintResult;
  },

  async getPrintJob(printJobId: number, options?: ApiRequestOptions): Promise<PrintJobStatusDto | null> {
    const response = await apiClient.get<ApiResponse<PrintJobStatusDto>>(
      `/api/PrinterManagement/jobs/${printJobId}`,
      options,
    );
    return unwrapApiResponse(response, true);
  },
};
