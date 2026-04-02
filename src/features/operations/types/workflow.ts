import type { FilterColumnConfig } from '@/types/paged';

export type WorkflowModuleKey =
  | 'goods-receipt'
  | 'transfer'
  | 'warehouse-inbound'
  | 'warehouse-outbound'
  | 'shipment'
  | 'subcontracting-issue'
  | 'subcontracting-receipt';

export interface WorkflowAssignedItem {
  id: number;
  documentNo?: string | null;
  orderId?: string | null;
  customerCode?: string | null;
  customerName?: string | null;
  projectCode?: string | null;
  sourceWarehouse?: string | null;
  targetWarehouse?: string | null;
  documentType?: string | null;
  plannedDate?: string | null;
  documentDate?: string | null;
  createdDate?: string | null;
  isCompleted?: boolean;
  isPendingApproval?: boolean;
}

export interface WorkflowHeaderDetail {
  id: number;
  branchCode?: string | null;
  documentNo?: string | null;
  documentType?: string | null;
  description1?: string | null;
  description2?: string | null;
  projectCode?: string | null;
  orderId?: string | null;
  customerCode?: string | null;
  customerName?: string | null;
  sourceWarehouse?: string | null;
  targetWarehouse?: string | null;
  documentDate?: string | null;
  plannedDate?: string | null;
  createdDate?: string | null;
  createdBy?: number | null;
  createdByFullUser?: string | null;
}

export interface WorkflowImportLineDetail {
  id: number;
  stockCode: string;
  stockName?: string | null;
  yapKod?: string | null;
  yapAcik?: string | null;
  description1?: string | null;
  description2?: string | null;
  description?: string | null;
  lineId?: number | null;
  routeId?: number | null;
}

export interface WorkflowLineDetail {
  id: number;
  stockCode: string;
  stockName?: string | null;
  yapKod?: string | null;
  yapAcik?: string | null;
  quantity: number;
  unit?: string | null;
  description?: string | null;
  erpOrderNo?: string | null;
  erpOrderId?: string | null;
}

export interface WorkflowLineSerialDetail {
  id: number;
  lineId: number;
  quantity: number;
  serialNo?: string | null;
  serialNo2?: string | null;
  serialNo3?: string | null;
  serialNo4?: string | null;
  sourceCellCode?: string | null;
  targetCellCode?: string | null;
}

export interface WorkflowRouteDetail {
  id: number;
  importLineId: number;
  stockCode: string;
  quantity: number;
  scannedBarcode?: string | null;
  serialNo?: string | null;
  serialNo2?: string | null;
  serialNo3?: string | null;
  serialNo4?: string | null;
  sourceWarehouse?: number | null;
  targetWarehouse?: number | null;
  sourceCellCode?: string | null;
  targetCellCode?: string | null;
  yapKod?: string | null;
  description?: string | null;
}

export interface WorkflowTerminalLineDetail {
  id: number;
  headerId: number;
  terminalUserId: number;
  createdBy?: number | null;
  createdByFullUser?: string | null;
}

export interface WorkflowModuleConfig {
  key: WorkflowModuleKey;
  titleKey: string;
  subtitleKey: string;
  createTitleKey: string;
  createDescriptionKey: string;
  assignedTitleKey: string;
  assignedDescriptionKey: string;
  pendingTitleKey: string;
  pendingTextKey: string;
  emptyTitleKey: string;
  emptyDescriptionKey: string;
  loadFailedKey: string;
  defaultFilterColumn: string;
  filterColumns: readonly FilterColumnConfig[];
  assignedEndpoint: string;
  listEndpoint: string;
  importLineEndpoint: string;
  lineEndpoint: string;
  lineSerialEndpoint: string;
  routeEndpoint: string;
  terminalLineEndpoint: string;
  accent: string;
  iconKey: 'receipt' | 'transfer' | 'inbound' | 'outbound' | 'shipment' | 'issue' | 'receiptSub';
}
