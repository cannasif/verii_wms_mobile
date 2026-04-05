export interface BaseDocumentHeaderRequest {
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
  customerId?: number;
  customerCode: string;
}

export interface BaseDocumentLineRequest {
  clientKey: string;
  stockId?: number;
  stockCode: string;
  yapKodId?: number;
  quantity: number;
  unit?: string;
  erpOrderNo?: string;
  erpOrderId?: string;
  description?: string;
}

export interface BaseDocumentImportLineRequest {
  lineClientKey: string | null;
  clientKey: string;
  stockId?: number;
  stockCode: string;
  yapKodId?: number;
}

export interface BaseWorkflowOrder {
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

export interface BaseWorkflowOrderItem extends BaseWorkflowOrder {
  id?: string;
  orderID: number;
  stockCode: string;
  stockName: string;
  projectCode: string;
}

export interface BaseSelectedStockItem {
  id: string;
  stockId?: number;
  yapKodId?: number;
  stockCode: string;
  stockName: string;
  unit: string;
}
