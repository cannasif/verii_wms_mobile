export type ReceiptMode = 'order' | 'stock';

export interface GoodsReceiptFormValues {
  receiptDate: string;
  documentNo: string;
  projectCode: string;
  isInvoice: boolean;
  customerId: string;
  notes: string;
}

export interface Customer {
  cariKod: string;
  cariIsim: string;
}

export interface Project {
  projeKod: string;
  projeAciklama: string;
}

export interface Warehouse {
  depoKodu: number;
  depoIsmi: string;
}

export interface Product {
  stokKodu: string;
  stokAdi: string;
  olcuBr1: string;
}

export interface Order {
  mode: string;
  siparisNo: string;
  orderID: number | null;
  customerCode: string;
  customerName: string;
  branchCode: number;
  targetWh: number;
  projectCode: string | null;
  orderDate: string;
  orderedQty: number;
  deliveredQty: number;
  remainingHamax: number;
  plannedQtyAllocated: number;
  remainingForImport: number;
}

export interface OrderItem {
  id?: string;
  mode: string;
  siparisNo: string;
  orderID: number;
  stockCode: string;
  stockName: string;
  customerCode: string;
  customerName: string;
  branchCode: number;
  targetWh: number;
  projectCode: string;
  orderDate: string;
  orderedQty: number;
  deliveredQty: number;
  remainingHamax: number;
  plannedQtyAllocated: number;
  remainingForImport: number;
  productCode?: string;
  productName?: string;
  quantity?: number;
  unit?: string;
}

export interface SelectedOrderItem extends OrderItem {
  receiptQuantity: number;
  isSelected: boolean;
  serialNo?: string;
  lotNo?: string;
  batchNo?: string;
  configCode?: string;
  warehouseId?: number;
}

export interface SelectedStockItem {
  id: string;
  stockCode: string;
  stockName: string;
  unit: string;
  receiptQuantity: number;
  isSelected: boolean;
  serialNo?: string;
  lotNo?: string;
  batchNo?: string;
  configCode?: string;
  warehouseId?: number;
}

export type SelectedReceiptItem = SelectedOrderItem | SelectedStockItem;

export interface BulkCreateRequest {
  header: {
    branchCode: string;
    projectCode?: string;
    orderId?: string;
    documentType: string;
    yearCode: string;
    description1?: string;
    description2?: string;
    priorityLevel?: number;
    plannedDate: string;
    isPlanned: boolean;
    customerCode: string;
    returnCode: boolean;
    ocrSource: boolean;
    description3?: string;
    description4?: string;
    description5?: string;
  };
  documents?: Array<{ base64: string }> | null;
  lines?: Array<{
    clientKey: string;
    stockCode: string;
    quantity: number;
    unit?: string;
    erpOrderNo?: string;
    erpOrderId?: string;
    description?: string;
  }>;
  importLines?: Array<{
    lineClientKey: string | null;
    clientKey: string;
    stockCode: string;
    configurationCode?: string;
    description1?: string;
    description2?: string;
  }>;
  serialLines?: Array<{
    importLineClientKey: string;
    serialNo: string;
    quantity: number;
    sourceCellCode?: string;
    targetCellCode?: string;
    serialNo2?: string;
    serialNo3?: string;
    serialNo4?: string;
  }>;
  routes?: Array<{
    importLineClientKey: string;
    scannedBarcode: string;
    quantity: number;
    description?: string;
    serialNo?: string;
    serialNo2?: string;
    serialNo3?: string;
    serialNo4?: string;
    sourceWarehouse?: number;
    targetWarehouse?: number;
    sourceCellCode?: string;
    targetCellCode?: string;
  }>;
}
