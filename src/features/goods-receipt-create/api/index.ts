import { apiClient } from '@/lib/axios';
import type { ApiRequestOptions } from '@/lib/request-utils';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedResponse } from '@/types/paged';
import type {
  Customer,
  GenerateGoodsReceiptOrderRequest,
  GoodsReceiptFormValues,
  Order,
  OrderItem,
  ProcessGoodsReceiptRequest,
  Product,
  Project,
  ReceiptMode,
  SelectedOrderItem,
  SelectedReceiptItem,
  SelectedStockItem,
  Warehouse,
  YapKodOption,
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

function buildGoodsReceiptGenerateOrderRequest(
  formData: GoodsReceiptFormValues,
  selectedItems: SelectedOrderItem[],
  branchCode?: string | number | null,
): GenerateGoodsReceiptOrderRequest {
  const currentYear = new Date().getFullYear().toString();
  const plannedDate = formData.receiptDate
    ? new Date(formData.receiptDate).toISOString()
    : new Date().toISOString();

  const lines = selectedItems.map((item) => ({
    clientKey: generateGuid(),
    stockId: item.stockId,
    stockCode: item.stockCode || item.productCode || '',
    yapKodId: item.yapKodId,
    quantity: item.orderedQty || 0,
    siparisMiktar: item.orderedQty || 0,
    unit: item.unit || undefined,
    erpOrderNo: item.siparisNo || undefined,
    erpOrderId: item.orderID?.toString() || undefined,
    description: item.stockName || item.productName || undefined,
  }));

  const serialLines = selectedItems
    .map((item, index) => {
      if (!item.serialNo && !item.lotNo && !item.batchNo && !item.configCode) {
        return null;
      }
      const line = lines[index];
      if (!line) {
        return null;
      }

      return {
        lineClientKey: line.clientKey,
        stockCode: item.stockCode,
        yapKod: item.configCode || undefined,
        serialNo: item.serialNo || '',
        quantity: item.receiptQuantity || 0,
        sourceWarehouseId: undefined,
        targetWarehouseId: item.warehouseId,
        sourceCellCode: undefined,
        targetCellCode: undefined,
        serialNo2: item.lotNo,
        serialNo3: item.batchNo,
        serialNo4: item.configCode,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  return {
    header: {
      branchCode: normalizeBranchCode(branchCode),
      projectCode: formData.projectCode || undefined,
      orderId: selectedItems[0]?.siparisNo || undefined,
      documentType: 'GR',
      yearCode: currentYear,
      description1: formData.documentNo || undefined,
      description2: formData.notes || undefined,
      priorityLevel: 0,
      plannedDate,
      isPlanned: false,
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      returnCode: false,
      ocrSource: false,
      description3: undefined,
      description4: undefined,
      description5: undefined,
    },
    lines: lines.length > 0 ? lines : undefined,
    lineSerials: serialLines.length > 0 ? serialLines : undefined,
  };
}

function buildGoodsReceiptProcessRequest(
  formData: GoodsReceiptFormValues,
  selectedItems: SelectedStockItem[],
  branchCode?: string | number | null,
): ProcessGoodsReceiptRequest {
  const currentYear = new Date().getFullYear().toString();
  const plannedDate = formData.receiptDate
    ? new Date(formData.receiptDate).toISOString()
    : new Date().toISOString();

  const routes = selectedItems
    .map((item) => {
      if (!item.receiptQuantity || item.receiptQuantity <= 0) {
        return null;
      }

      return {
        stockId: item.stockId,
        stockCode: item.stockCode,
        yapKodId: item.yapKodId,
        yapKod: item.configCode || undefined,
        scannedBarcode: '',
        quantity: item.receiptQuantity,
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
      orderId: undefined,
      documentType: 'GR',
      yearCode: currentYear,
      description1: formData.documentNo || undefined,
      description2: formData.notes || undefined,
      priorityLevel: 0,
      plannedDate,
      isPlanned: false,
      customerId: formData.customerRefId,
      customerCode: formData.customerId || '',
      returnCode: false,
      ocrSource: false,
      description3: undefined,
      description4: undefined,
      description5: undefined,
    },
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

interface WmsCustomerLookupDto {
  id: number;
  customerCode: string;
  customerName: string;
}

interface WmsWarehouseLookupDto {
  id: number;
  warehouseCode: number;
  warehouseName: string;
}

interface WmsStockLookupDto {
  id: number;
  erpStockCode: string;
  stockName: string;
  unit?: string | null;
}

interface WmsYapKodLookupDto {
  id: number;
  yapKod: string;
  yapAcik: string;
  yplndrStokKod?: string | null;
}

export const goodsReceiptCreateApi = {
  async getCustomers(options?: ApiRequestOptions): Promise<Customer[]> {
    const customers = await getErpPagedData<WmsCustomerLookupDto>('/api/Customer/paged', options);
    return customers.map((customer) => ({
      id: customer.id,
      cariKod: customer.customerCode,
      cariIsim: customer.customerName,
    }));
  },

  async getProjects(options?: ApiRequestOptions): Promise<Project[]> {
    return getErpPagedData<Project>('/api/Erp/projects/paged', options);
  },

  async getWarehouses(options?: ApiRequestOptions): Promise<Warehouse[]> {
    const warehouses = await getErpPagedData<WmsWarehouseLookupDto>('/api/Warehouse/paged', options);
    return warehouses.map((warehouse) => ({
      id: warehouse.id,
      depoKodu: warehouse.warehouseCode,
      depoIsmi: warehouse.warehouseName,
    }));
  },

  async getProducts(options?: ApiRequestOptions): Promise<Product[]> {
    const products = await getErpPagedData<WmsStockLookupDto>('/api/Stock/paged', options);
    return products.map((product) => ({
      id: product.id,
      stokKodu: product.erpStockCode,
      stokAdi: product.stockName,
      olcuBr1: product.unit || '',
    }));
  },

  async getYapKodlar(options?: ApiRequestOptions): Promise<YapKodOption[]> {
    const items = await getErpPagedData<WmsYapKodLookupDto>('/api/YapKod/paged', options);
    return items.map((item) => ({
      id: item.id,
      yapKod: item.yapKod,
      yapAcik: item.yapAcik,
      yplndrStokKod: item.yplndrStokKod || undefined,
    }));
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
    if (receiptMode === 'stock') {
      const request = buildGoodsReceiptProcessRequest(formData, selectedItems.filter((item): item is SelectedStockItem => !('siparisNo' in item)), branchCode);
      const response = await apiClient.post<ApiResponse<number>>('/api/GrHeader/process', request);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Mal kabul işlemi oluşturulamadı.');
      }
      return response.data.data || 0;
    }

    const request = buildGoodsReceiptGenerateOrderRequest(formData, selectedItems.filter((item): item is SelectedOrderItem => 'siparisNo' in item), branchCode);
    const response = await apiClient.post<ApiResponse<{ id: number }>>('/api/GrHeader/generate', request);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Mal kabul emri oluşturulamadı.');
    }
    return response.data.data?.id || 0;
  },
};
