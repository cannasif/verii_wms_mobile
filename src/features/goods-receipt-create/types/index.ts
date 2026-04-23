import type {
  BaseDocumentHeaderRequest,
  BaseDocumentImportLineRequest,
  BaseDocumentLineRequest,
  BaseSelectedStockItem,
  BaseWorkflowOrder,
  BaseWorkflowOrderItem,
} from '@/types/document-models';

export type ReceiptMode = 'order' | 'stock';

export interface GoodsReceiptFormValues {
  receiptDate: string;
  documentNo: string;
  projectCode: string;
  isInvoice: boolean;
  customerId: string;
  customerRefId?: number;
  notes: string;
}

export interface Customer {
  id: number;
  cariKod: string;
  cariIsim: string;
}

export interface Project {
  projeKod: string;
  projeAciklama: string;
}

export interface Warehouse {
  id: number;
  depoKodu: number;
  depoIsmi: string;
}

export interface Product {
  id: number;
  stokKodu: string;
  stokAdi: string;
  olcuBr1: string;
}

export interface YapKodOption {
  id: number;
  yapKod: string;
  yapAcik: string;
  stockId?: number;
  yplndrStokKod?: string;
}

export interface Order extends BaseWorkflowOrder {}

export interface OrderItem extends BaseWorkflowOrderItem {
  productCode?: string;
  productName?: string;
  quantity?: number;
  unit?: string;
}

export interface SelectedOrderItem extends OrderItem {
  stockId?: number;
  yapKodId?: number;
  receiptQuantity: number;
  isSelected: boolean;
  serialNo?: string;
  lotNo?: string;
  batchNo?: string;
  configCode?: string;
  warehouseId?: number;
}

export interface SelectedStockItem extends BaseSelectedStockItem {
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
  header: BaseDocumentHeaderRequest & {
    returnCode: boolean;
    ocrSource: boolean;
    description3?: string;
    description4?: string;
    description5?: string;
  };
  documents?: Array<{ base64: string }> | null;
  lines?: Array<BaseDocumentLineRequest>;
  importLines?: Array<BaseDocumentImportLineRequest & {
    yapKod?: string;
  }>;
  serialLines?: Array<{
    lineClientKey?: string | null;
    stockCode?: string;
    yapKod?: string;
    serialNo: string;
    quantity: number;
    sourceWarehouseId?: number;
    targetWarehouseId?: number;
    sourceCellCode?: string;
    targetCellCode?: string;
    serialNo2?: string;
    serialNo3?: string;
    serialNo4?: string;
  }>;
  routes?: Array<{
    lineClientKey?: string | null;
    stockCode?: string;
    yapKod?: string;
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

export interface GenerateGoodsReceiptOrderRequest {
  header: BulkCreateRequest['header'];
  lines?: Array<NonNullable<BulkCreateRequest['lines']>[number]>;
  lineSerials?: Array<{
    lineClientKey?: string | null;
    stockCode?: string;
    yapKod?: string;
    serialNo: string;
    quantity: number;
    sourceWarehouseId?: number;
    targetWarehouseId?: number;
    sourceCellCode?: string;
    targetCellCode?: string;
    serialNo2?: string;
    serialNo3?: string;
    serialNo4?: string;
  }>;
}

export interface ProcessGoodsReceiptRequest {
  header: BulkCreateRequest['header'];
  routes?: Array<{
    stockId?: number;
    stockCode?: string;
    yapKodId?: number;
    yapKod?: string;
    scannedBarcode: string;
    quantity: number;
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
