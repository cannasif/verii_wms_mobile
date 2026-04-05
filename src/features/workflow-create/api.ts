import i18next from 'i18next';
import { apiClient } from '@/lib/axios';
import type { ApiRequestOptions } from '@/lib/request-utils';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedResponse } from '@/types/paged';
import { useAuthStore } from '@/store/auth';
import type {
  ActiveUserOption,
  CreateWorkflowMode,
  CustomerOption,
  ProductBarcodeOption,
  ProductOption,
  ProjectOption,
  YapKodOption,
  SelectedWorkflowItem,
  WarehouseOption,
  WorkflowCreateFormValues,
  WorkflowCreateModuleMeta,
  WorkflowOrder,
  WorkflowOrderItem,
} from './types';

function randomGuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getActiveBranchCode(): string {
  return useAuthStore.getState().branch?.code?.trim() || '0';
}

function requireData<T>(response: ApiResponse<T>, fallbackKey: string): T {
  if (response.success && response.data !== undefined && response.data !== null) {
    return response.data;
  }

  throw new Error(response.message || i18next.t(fallbackKey));
}

async function getErpPagedData<T>(url: string, fallbackKey: string, options?: ApiRequestOptions): Promise<T[]> {
  const response = await apiClient.post<ApiResponse<PagedResponse<T>>>(url, buildPagedRequest({ pageNumber: 1, pageSize: 1000 }), options);
  return requireData(response.data, fallbackKey).data;
}

function buildTransferRequest(
  formData: WorkflowCreateFormValues,
  selectedItems: SelectedWorkflowItem[],
  isFreeTransfer: boolean,
) {
  const now = new Date().toISOString();
  const lines: Array<Record<string, unknown>> = [];
  const lineSerials: Array<Record<string, unknown>> = [];

  selectedItems.forEach((item) => {
    const clientKey = randomGuid();
    const clientGuid = randomGuid();

    lines.push({
      clientKey,
      clientGuid,
      stockId: item.stockId,
      stockCode: item.stockCode,
      yapKodId: 'yapKodId' in item ? item.yapKodId : undefined,
      yapKod: '',
      orderId: 0,
      quantity: item.transferQuantity,
      unit: 'unit' in item ? item.unit || '' : '',
      erpOrderNo: '',
      erpOrderId: '',
      erpLineReference: '',
      description: '',
    });

    lineSerials.push({
      quantity: item.transferQuantity,
      serialNo: item.serialNo || '',
      serialNo2: item.serialNo2 || '',
      serialNo3: item.lotNo || '',
      serialNo4: item.batchNo || '',
      sourceCellCode: item.sourceCellCode || '',
      targetCellCode: item.targetCellCode || '',
      lineClientKey: clientKey,
      lineGroupGuid: clientGuid,
    });
  });

  const firstItemSourceWarehouse = selectedItems.length > 0 && 'sourceWarehouse' in selectedItems[0]
    ? selectedItems[0].sourceWarehouse
    : undefined;

  return {
    header: {
      branchCode: getActiveBranchCode(),
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType: 'WT',
      yearCode: new Date().getFullYear().toString(),
      description1: formData.notes || '',
      description2: '',
      priorityLevel: 0,
      plannedDate: formData.transferDate,
      isPlanned: true,
      isCompleted: false,
      completedDate: now,
      documentNo: formData.documentNo,
      documentDate: formData.transferDate,
      customerId: isFreeTransfer ? undefined : formData.customerRefId,
      customerCode: isFreeTransfer ? '' : (formData.customerId || ''),
      customerName: '',
      sourceWarehouseId: isFreeTransfer ? formData.sourceWarehouseRefId : undefined,
      sourceWarehouse: isFreeTransfer ? (formData.sourceWarehouse || '') : (firstItemSourceWarehouse ? String(firstItemSourceWarehouse) : ''),
      targetWarehouseId: formData.targetWarehouseRefId,
      targetWarehouse: formData.targetWarehouse,
      priority: '',
      type: isFreeTransfer ? 1 : 0,
    },
    lines,
    lineSerials,
    terminalLines: formData.userIds.map((userId) => ({ terminalUserId: userId })),
    userIds: formData.userIds.length > 0 ? formData.userIds : undefined,
  };
}

function buildShipmentRequest(formData: WorkflowCreateFormValues, selectedItems: SelectedWorkflowItem[]) {
  const now = new Date().toISOString();
  const lines: Array<Record<string, unknown>> = [];
  const lineSerials: Array<Record<string, unknown>> = [];

  selectedItems.forEach((item) => {
    const clientKey = randomGuid();
    const clientGuid = randomGuid();

    lines.push({
      clientKey,
      clientGuid,
      stockId: item.stockId,
      stockCode: item.stockCode,
      yapKodId: 'yapKodId' in item ? item.yapKodId : undefined,
      stockName: 'stockName' in item ? item.stockName : '',
      yapKod: 'yapKod' in item ? item.yapKod || '' : '',
      yapAcik: 'yapAcik' in item ? item.yapAcik || '' : '',
      orderId: 'orderID' in item ? item.orderID || 0 : 0,
      quantity: item.transferQuantity,
      unit: 'unit' in item ? item.unit || '' : '',
      erpOrderNo: 'siparisNo' in item ? item.siparisNo || '' : '',
      erpOrderId: 'orderID' in item ? String(item.orderID || '') : '',
      erpLineReference: '',
      description: '',
    });

    lineSerials.push({
      quantity: item.transferQuantity,
      serialNo: item.serialNo || '',
      serialNo2: item.serialNo2 || '',
      serialNo3: item.lotNo || '',
      serialNo4: item.batchNo || '',
      sourceCellCode: item.sourceCellCode || '',
      targetCellCode: item.targetCellCode || '',
      lineClientKey: clientKey,
      lineGroupGuid: clientGuid,
    });
  });

  return {
    header: {
      branchCode: getActiveBranchCode(),
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType: 'SH',
      yearCode: new Date().getFullYear().toString(),
      description1: formData.notes || '',
      description2: '',
      priorityLevel: 0,
      plannedDate: formData.transferDate,
      isPlanned: true,
      isCompleted: false,
      completedDate: now,
      documentNo: formData.documentNo,
      documentDate: formData.transferDate,
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      customerName: '',
      sourceWarehouseId: formData.sourceWarehouseRefId,
      sourceWarehouse: formData.sourceWarehouse,
      targetWarehouse: '',
      priority: '',
      type: 0,
    },
    lines,
    lineSerials,
    terminalLines: formData.userIds.map((userId) => ({ terminalUserId: userId })),
    userIds: formData.userIds.length > 0 ? formData.userIds : undefined,
  };
}

function buildWarehouseRequest(
  formData: WorkflowCreateFormValues,
  selectedItems: SelectedWorkflowItem[],
  direction: 'inbound' | 'outbound',
) {
  const now = new Date().toISOString();
  const lines: Array<Record<string, unknown>> = [];
  const lineSerials: Array<Record<string, unknown>> = [];

  selectedItems.forEach((item) => {
    const clientKey = randomGuid();
    const clientGuid = randomGuid();

    lines.push({
      clientKey,
      clientGuid,
      stockId: item.stockId,
      stockCode: item.stockCode,
      yapKodId: 'yapKodId' in item ? item.yapKodId : undefined,
      stockName: 'stockName' in item ? item.stockName : '',
      yapKod: 'yapKod' in item ? item.yapKod || '' : '',
      yapAcik: 'yapAcik' in item ? item.yapAcik || '' : '',
      orderId: 'orderID' in item ? item.orderID || 0 : 0,
      quantity: item.transferQuantity,
      unit: 'unit' in item ? item.unit || '' : '',
      erpOrderNo: 'siparisNo' in item ? item.siparisNo || '' : '',
      erpOrderId: 'orderID' in item ? String(item.orderID || '') : '',
      erpLineReference: '',
      description: '',
    });

    lineSerials.push({
      quantity: item.transferQuantity,
      serialNo: item.serialNo || '',
      serialNo2: item.serialNo2 || '',
      serialNo3: item.lotNo || '',
      serialNo4: item.batchNo || '',
      sourceCellCode: item.sourceCellCode || '',
      targetCellCode: item.targetCellCode || '',
      lineClientKey: clientKey,
      lineGroupGuid: clientGuid,
    });
  });

  return {
    header: {
      branchCode: getActiveBranchCode(),
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType: direction === 'inbound' ? 'WI' : 'WO',
      yearCode: new Date().getFullYear().toString(),
      description1: formData.notes || '',
      description2: '',
      priorityLevel: 0,
      plannedDate: formData.transferDate,
      isPlanned: true,
      isCompleted: false,
      completedDate: now,
      documentNo: formData.documentNo,
      documentDate: formData.transferDate,
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      customerName: '',
      sourceWarehouseId: direction === 'outbound' ? formData.sourceWarehouseRefId : undefined,
      sourceWarehouse: direction === 'outbound' ? formData.sourceWarehouse || '' : '',
      targetWarehouseId: direction === 'inbound' ? formData.targetWarehouseRefId : undefined,
      targetWarehouse: direction === 'inbound' ? formData.targetWarehouse || '' : '',
      priority: '',
      ...(direction === 'inbound'
        ? { inboundType: formData.operationType || '' }
        : { outboundType: formData.operationType || '' }),
    },
    lines,
    lineSerials,
    terminalLines: formData.userIds.map((userId) => ({ terminalUserId: userId })),
    userIds: formData.userIds.length > 0 ? formData.userIds : undefined,
  };
}

function buildWarehouseOutboundProcessRequest(
  formData: WorkflowCreateFormValues,
  selectedItems: SelectedWorkflowItem[],
) {
  const now = new Date().toISOString();
  const positiveItems = selectedItems.filter((item) => Number.isFinite(item.transferQuantity) && item.transferQuantity > 0);
  const sourceWarehouse = formData.sourceWarehouse ? Number(formData.sourceWarehouse) : undefined;
  const lines: Array<Record<string, unknown>> = [];
  const importLines: Array<Record<string, unknown>> = [];
  const routes: Array<Record<string, unknown>> = [];
  const importLineGroups = new Map<string, { clientKey: string; clientGroupGuid: string }>();

  positiveItems.forEach((item) => {
    const lineClientKey = randomGuid();
    const lineGroupGuid = randomGuid();
    const yapKod = 'yapKod' in item ? item.yapKod || '' : '';
    const importGroupingKey = `${item.stockCode}__${yapKod}`;
    let importLineGroup = importLineGroups.get(importGroupingKey);
    if (!importLineGroup) {
      importLineGroup = {
        clientKey: randomGuid(),
        clientGroupGuid: randomGuid(),
      };
      importLineGroups.set(importGroupingKey, importLineGroup);
      importLines.push({
        clientKey: importLineGroup.clientKey,
        clientGroupGuid: importLineGroup.clientGroupGuid,
        stockId: item.stockId,
        stockCode: item.stockCode,
        yapKodId: 'yapKodId' in item ? item.yapKodId : undefined,
        yapKod,
        quantity: item.transferQuantity,
        unit: 'unit' in item ? item.unit || '' : '',
        erpOrderNumber: '',
        erpOrderNo: '',
        erpOrderLineNumber: '',
      });
    }

    lines.push({
      clientKey: lineClientKey,
      clientGuid: lineGroupGuid,
      stockId: item.stockId,
      stockCode: item.stockCode,
      yapKodId: 'yapKodId' in item ? item.yapKodId : undefined,
      yapKod,
      quantity: item.transferQuantity,
      unit: 'unit' in item ? item.unit || '' : '',
      erpOrderNo: '',
      erpOrderId: '',
      description: 'stockName' in item ? item.stockName || '' : '',
    });

    routes.push({
      importLineClientKey: importLineGroup.clientKey,
      importLineGroupGuid: importLineGroup.clientGroupGuid,
      stockCode: item.stockCode,
      yapKod,
      quantity: item.transferQuantity,
      serialNo: item.serialNo || '',
      serialNo2: item.serialNo2 || '',
      serialNo3: item.lotNo || '',
      serialNo4: item.batchNo || '',
      scannedBarcode: 'scannedBarcode' in item ? item.scannedBarcode || item.stockCode : item.stockCode,
      sourceWarehouse,
      targetWarehouse: undefined,
      sourceCellCode: item.sourceCellCode || '',
      targetCellCode: item.targetCellCode || '',
      description: item.configCode || '',
    });
  });

  return {
    header: {
      branchCode: getActiveBranchCode(),
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType: 'WO',
      yearCode: new Date().getFullYear().toString(),
      description1: formData.notes || '',
      description2: '',
      priorityLevel: 0,
      plannedDate: formData.transferDate,
      isPlanned: true,
      isCompleted: false,
      completedDate: now,
      documentNo: formData.documentNo,
      documentDate: formData.transferDate,
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      sourceWarehouseId: formData.sourceWarehouseRefId,
      sourceWarehouse: formData.sourceWarehouse || '',
      targetWarehouse: '',
      outboundType: formData.operationType || '',
      type: 0,
    },
    lines,
    importLines,
    routes,
  };
}

function buildSubcontractingRequest(
  formData: WorkflowCreateFormValues,
  selectedItems: SelectedWorkflowItem[],
  type: 'issue' | 'receipt',
) {
  const now = new Date().toISOString();
  const lines: Array<Record<string, unknown>> = [];
  const lineSerials: Array<Record<string, unknown>> = [];

  selectedItems.forEach((item) => {
    const clientKey = randomGuid();
    const clientGuid = randomGuid();

    lines.push({
      clientKey,
      clientGuid,
      stockId: item.stockId,
      stockCode: item.stockCode,
      yapKodId: 'yapKodId' in item ? item.yapKodId : undefined,
      stockName: 'stockName' in item ? item.stockName : '',
      yapKod: 'yapKod' in item ? item.yapKod || '' : '',
      yapAcik: 'yapAcik' in item ? item.yapAcik || '' : '',
      orderId: 'orderID' in item ? item.orderID || 0 : 0,
      quantity: item.transferQuantity,
      unit: 'unit' in item ? item.unit || '' : '',
      erpOrderNo: 'siparisNo' in item ? item.siparisNo || '' : '',
      erpOrderId: 'orderID' in item ? String(item.orderID || '') : '',
      erpLineReference: '',
      description: '',
    });

    lineSerials.push({
      quantity: item.transferQuantity,
      serialNo: item.serialNo || '',
      serialNo2: item.serialNo2 || '',
      serialNo3: item.lotNo || '',
      serialNo4: item.batchNo || '',
      sourceCellCode: item.sourceCellCode || '',
      targetCellCode: item.targetCellCode || '',
      lineClientKey: clientKey,
      lineGroupGuid: clientGuid,
    });
  });

  return {
    header: {
      branchCode: getActiveBranchCode(),
      projectCode: formData.projectCode || '',
      orderId: '',
      documentType: type === 'issue' ? 'SIT' : 'SRT',
      yearCode: new Date().getFullYear().toString(),
      description1: formData.notes || '',
      description2: '',
      priorityLevel: 0,
      plannedDate: formData.transferDate,
      isPlanned: true,
      isCompleted: false,
      completedDate: now,
      documentNo: formData.documentNo,
      documentDate: formData.transferDate,
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      customerName: '',
      sourceWarehouseId: formData.sourceWarehouseRefId,
      sourceWarehouse: formData.sourceWarehouse,
      targetWarehouseId: formData.targetWarehouseRefId,
      targetWarehouse: formData.targetWarehouse,
      priority: '',
      type: 0,
    },
    lines,
    lineSerials,
    terminalLines: formData.userIds.map((userId) => ({ terminalUserId: userId })),
    userIds: formData.userIds.length > 0 ? formData.userIds : undefined,
  };
}

function resolveOrderEndpoints(moduleKey: WorkflowCreateModuleMeta['key']) {
  switch (moduleKey) {
    case 'transfer':
      return { headers: '/api/WtFunction/headers', lines: '/api/WtFunction/lines' };
    case 'warehouse-inbound':
      return { headers: '/api/WiFunction/headers', lines: '/api/WiFunction/lines' };
    case 'warehouse-outbound':
      return { headers: '/api/WoFunction/headers', lines: '/api/WoFunction/lines' };
    case 'shipment':
      return { headers: '/api/ShFunction/headers', lines: '/api/ShFunction/lines' };
    case 'subcontracting-issue':
      return { headers: '/api/SitFunction/headers', lines: '/api/SitFunction/lines' };
    case 'subcontracting-receipt':
      return { headers: '/api/SrtFunction/headers', lines: '/api/SrtFunction/lines' };
    default:
      throw new Error('Unsupported module');
  }
}

function resolveCreateEndpoint(moduleKey: WorkflowCreateModuleMeta['key']) {
  switch (moduleKey) {
    case 'transfer':
      return '/api/WtHeader/generate';
    case 'warehouse-inbound':
      return '/api/WiHeader/generate';
    case 'warehouse-outbound':
      return '/api/WoHeader/generate';
    case 'shipment':
      return '/api/ShHeader/generate';
    case 'subcontracting-issue':
      return '/api/SitHeader/generate';
    case 'subcontracting-receipt':
      return '/api/SrtHeader/generate';
    default:
      throw new Error('Unsupported module');
  }
}

function resolveFreeCreateEndpoint(moduleKey: WorkflowCreateModuleMeta['key']) {
  switch (moduleKey) {
    case 'warehouse-outbound':
      return '/api/WoHeader/bulk-create';
    default:
      return resolveCreateEndpoint(moduleKey);
  }
}

export const workflowCreateApi = {
  async getCustomers(options?: ApiRequestOptions): Promise<CustomerOption[]> {
    const customers = await getErpPagedData<{
      id: number;
      customerCode: string;
      customerName: string;
    }>('/api/Customer/paged', 'workflowCreate.errors.customerLoad', options);

    return customers.map((customer) => ({
      id: customer.id,
      cariKod: customer.customerCode,
      cariIsim: customer.customerName,
    }));
  },
  async getProjects(options?: ApiRequestOptions): Promise<ProjectOption[]> {
    return getErpPagedData<ProjectOption>('/api/Erp/projects/paged', 'workflowCreate.errors.projectLoad', options);
  },
  async getWarehouses(options?: ApiRequestOptions): Promise<WarehouseOption[]> {
    const warehouses = await getErpPagedData<{
      id: number;
      warehouseCode: number;
      warehouseName: string;
    }>('/api/Warehouse/paged', 'workflowCreate.errors.warehouseLoad', options);

    return warehouses.map((warehouse) => ({
      id: warehouse.id,
      depoKodu: warehouse.warehouseCode,
      depoIsmi: warehouse.warehouseName,
    }));
  },
  async getProducts(options?: ApiRequestOptions): Promise<ProductOption[]> {
    const products = await getErpPagedData<{
      id: number;
      erpStockCode: string;
      stockName: string;
      unit?: string | null;
    }>('/api/Stock/paged', 'workflowCreate.errors.productLoad', options);

    return products.map((product) => ({
      id: product.id,
      stokKodu: product.erpStockCode,
      stokAdi: product.stockName,
      olcuBr1: product.unit || '',
    }));
  },
  async getYapKodlar(options?: ApiRequestOptions): Promise<YapKodOption[]> {
    const items = await getErpPagedData<{
      id: number;
      yapKod: string;
      yapAcik: string;
      yplndrStokKod?: string | null;
    }>('/api/YapKod/paged', 'workflowCreate.errors.productLoad', options);

    return items.map((item) => ({
      id: item.id,
      yapKod: item.yapKod,
      yapAcik: item.yapAcik,
      yplndrStokKod: item.yplndrStokKod || undefined,
    }));
  },
  async getStokBarcode(barcode: string, barcodeGroup: string = '1', options?: ApiRequestOptions): Promise<ProductBarcodeOption[]> {
    const response = await apiClient.get<ApiResponse<ProductBarcodeOption[]>>('/api/Erp/getStokBarcode', {
      params: { bar: barcode, barkodGrubu: barcodeGroup },
      ...options,
    });
    return requireData(response.data, 'workflowCreate.errors.barcodeLoad');
  },
  async getActiveUsers(options?: ApiRequestOptions): Promise<ActiveUserOption[]> {
    const response = await apiClient.get<ApiResponse<ActiveUserOption[]>>('/api/auth/users/active', options);
    return requireData(response.data, 'workflowCreate.errors.userLoad');
  },
  async getOrdersByCustomer(moduleKey: WorkflowCreateModuleMeta['key'], customerCode: string, options?: ApiRequestOptions): Promise<WorkflowOrder[]> {
    const endpoints = resolveOrderEndpoints(moduleKey);
    const response = await apiClient.get<ApiResponse<WorkflowOrder[]>>(`${endpoints.headers}/${customerCode}`, options);
    return requireData(response.data, 'workflowCreate.errors.orderLoad');
  },
  async getOrderItems(moduleKey: WorkflowCreateModuleMeta['key'], orderNumbersCsv: string, options?: ApiRequestOptions): Promise<WorkflowOrderItem[]> {
    const endpoints = resolveOrderEndpoints(moduleKey);
    const response = await apiClient.get<ApiResponse<WorkflowOrderItem[]>>(`${endpoints.lines}/${orderNumbersCsv}`, options);
    return requireData(response.data, 'workflowCreate.errors.itemLoad');
  },
  async create(
    moduleMeta: WorkflowCreateModuleMeta,
    formData: WorkflowCreateFormValues,
    selectedItems: SelectedWorkflowItem[],
    mode: CreateWorkflowMode,
  ): Promise<void> {
    const payload = (() => {
      switch (moduleMeta.key) {
        case 'transfer':
          return buildTransferRequest(formData, selectedItems, mode === 'free');
        case 'warehouse-inbound':
          return buildWarehouseRequest(formData, selectedItems, 'inbound');
        case 'warehouse-outbound':
          return mode === 'free'
            ? buildWarehouseOutboundProcessRequest(formData, selectedItems)
            : buildWarehouseRequest(formData, selectedItems, 'outbound');
        case 'shipment':
          return buildShipmentRequest(formData, selectedItems);
        case 'subcontracting-issue':
          return buildSubcontractingRequest(formData, selectedItems, 'issue');
        case 'subcontracting-receipt':
          return buildSubcontractingRequest(formData, selectedItems, 'receipt');
        default:
          throw new Error('Unsupported module');
      }
    })();

    const endpoint = mode === 'free' ? resolveFreeCreateEndpoint(moduleMeta.key) : resolveCreateEndpoint(moduleMeta.key);
    const response = await apiClient.post<ApiResponse<unknown>>(endpoint, payload);
    if (!response.data.success) {
      throw new Error(response.data.message || i18next.t('workflowCreate.errors.createFailed'));
    }
  },
};
