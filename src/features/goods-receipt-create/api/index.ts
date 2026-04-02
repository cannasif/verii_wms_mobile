import { apiClient } from '@/lib/axios';
import type { ApiRequestOptions } from '@/lib/request-utils';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedResponse } from '@/types/paged';
import type {
  BulkCreateRequest,
  Customer,
  GoodsReceiptFormValues,
  Order,
  OrderItem,
  Product,
  Project,
  ReceiptMode,
  SelectedOrderItem,
  SelectedReceiptItem,
  SelectedStockItem,
  Warehouse,
} from '../types';

function generateGuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function normalizeBranchCode(branchCode?: string | number | null): string {
  if (branchCode === undefined || branchCode === null) {
    return '0';
  }

  const normalized = String(branchCode).trim();
  return normalized.length > 0 ? normalized : '0';
}

function buildGoodsReceiptBulkCreateRequest(
  formData: GoodsReceiptFormValues,
  selectedItems: SelectedReceiptItem[],
  isStockBased: boolean,
  branchCode?: string | number | null,
): BulkCreateRequest {
  const currentYear = new Date().getFullYear().toString();
  const plannedDate = formData.receiptDate
    ? new Date(formData.receiptDate).toISOString()
    : new Date().toISOString();

  const lines = isStockBased
    ? []
    : selectedItems.map((item) => {
        const orderItem = item as SelectedOrderItem;
        return {
          clientKey: generateGuid(),
          stockCode: orderItem.stockCode || orderItem.productCode || '',
          quantity: orderItem.orderedQty || 0,
          unit: orderItem.unit || undefined,
          erpOrderNo: orderItem.siparisNo || undefined,
          erpOrderId: orderItem.orderID?.toString() || undefined,
          description: orderItem.stockName || orderItem.productName || undefined,
        };
      });

  const importLines = selectedItems.map((item) => {
    const clientKey = generateGuid();
    const correspondingLine = isStockBased
      ? null
      : lines.find((line) => line.stockCode === item.stockCode);

    return {
      lineClientKey: correspondingLine?.clientKey || null,
      clientKey,
      stockCode: item.stockCode,
      configurationCode: item.configCode || undefined,
      description1: item.stockName || undefined,
      description2: undefined,
    };
  });

  const serialLines = selectedItems
    .map((item, index) => {
      if (!item.serialNo && !item.lotNo && !item.batchNo && !item.configCode) {
        return null;
      }

      const importLine = importLines[index];
      if (!importLine) {
        return null;
      }

      return {
        importLineClientKey: importLine.clientKey,
        serialNo: item.serialNo || '',
        quantity: item.receiptQuantity || 0,
        sourceCellCode: undefined,
        targetCellCode: undefined,
        serialNo2: item.lotNo,
        serialNo3: item.batchNo,
        serialNo4: item.configCode,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  const routes = selectedItems
    .map((item, index) => {
      const importLine = importLines[index];
      if (!importLine || !item.receiptQuantity || item.receiptQuantity <= 0) {
        return null;
      }

      return {
        importLineClientKey: importLine.clientKey,
        scannedBarcode: '',
        quantity: item.receiptQuantity,
        description: item.stockName || undefined,
        serialNo: item.serialNo,
        serialNo2: item.lotNo,
        serialNo3: item.batchNo,
        serialNo4: item.configCode,
        sourceWarehouse: undefined,
        targetWarehouse: item.warehouseId,
        sourceCellCode: undefined,
        targetCellCode: undefined,
      };
    })
    .filter((route): route is NonNullable<typeof route> => route !== null);

  return {
    header: {
      branchCode: normalizeBranchCode(branchCode),
      projectCode: formData.projectCode || undefined,
      orderId: isStockBased ? undefined : (selectedItems[0] && 'siparisNo' in selectedItems[0] ? selectedItems[0].siparisNo : undefined),
      documentType: 'GR',
      yearCode: currentYear,
      description1: formData.documentNo || undefined,
      description2: formData.notes || undefined,
      priorityLevel: 0,
      plannedDate,
      isPlanned: false,
      customerCode: formData.customerId || '',
      returnCode: false,
      ocrSource: false,
      description3: undefined,
      description4: undefined,
      description5: undefined,
    },
    documents: null,
    lines: lines.length > 0 ? lines : undefined,
    importLines: importLines.length > 0 ? importLines : undefined,
    serialLines: serialLines.length > 0 ? serialLines : undefined,
    routes: routes.length > 0 ? routes : undefined,
  };
}


async function getErpPagedData<T>(url: string, options?: ApiRequestOptions): Promise<T[]> {
  const response = await apiClient.post<ApiResponse<PagedResponse<T>>>(url, buildPagedRequest({ pageNumber: 1, pageSize: 1000 }), options);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'ERP verisi alınamadı.');
  }
  return response.data.data.data;
}

export const goodsReceiptCreateApi = {
  async getCustomers(options?: ApiRequestOptions): Promise<Customer[]> {
    return getErpPagedData<Customer>('/api/Erp/customers/paged', options);
  },

  async getProjects(options?: ApiRequestOptions): Promise<Project[]> {
    return getErpPagedData<Project>('/api/Erp/projects/paged', options);
  },

  async getWarehouses(options?: ApiRequestOptions): Promise<Warehouse[]> {
    return getErpPagedData<Warehouse>('/api/Erp/warehouses/paged', options);
  },

  async getProducts(options?: ApiRequestOptions): Promise<Product[]> {
    return getErpPagedData<Product>('/api/Erp/products/paged', options);
  },

  async getOrdersByCustomer(customerCode: string, options?: ApiRequestOptions): Promise<Order[]> {
    const response = await apiClient.get<ApiResponse<Order[]>>(`/api/GoodReciptFunctions/headers/customer/${customerCode}`, options);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Sipariş listesi alınamadı.');
    }
    return response.data.data;
  },

  async getOrderItems(customerCode: string, orderNumbersCsv: string, options?: ApiRequestOptions): Promise<OrderItem[]> {
    const response = await apiClient.get<ApiResponse<OrderItem[]>>(`/api/GoodReciptFunctions/lines/customer/${customerCode}/orders/${orderNumbersCsv}`, options);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Sipariş kalemleri alınamadı.');
    }
    return response.data.data;
  },

  async createGoodsReceipt(
    formData: GoodsReceiptFormValues,
    selectedItems: SelectedReceiptItem[],
    receiptMode: ReceiptMode,
    branchCode?: string | number | null,
  ): Promise<number> {
    const request = buildGoodsReceiptBulkCreateRequest(formData, selectedItems, receiptMode === 'stock', branchCode);
    const response = await apiClient.post<ApiResponse<number>>('/api/GrHeader/bulkCreate', request);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Mal kabul oluşturulamadı.');
    }
    return response.data.data || 0;
  },
};
