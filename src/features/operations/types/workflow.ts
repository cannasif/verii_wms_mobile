import type { FilterColumnConfig } from '@/types/paged';
import type {
  BaseWorkflowHeaderDetail,
  BaseWorkflowImportLineDetail,
  BaseWorkflowLineDetail,
  BaseWorkflowLineSerialDetail,
  BaseWorkflowRouteDetail,
} from './detail-models';

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

export interface WorkflowHeaderDetail extends BaseWorkflowHeaderDetail {
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

export interface WorkflowImportLineDetail extends BaseWorkflowImportLineDetail {
  yapAcik?: string | null;
  lineId?: number | null;
  routeId?: number | null;
}

export interface WorkflowLineDetail extends BaseWorkflowLineDetail {
  erpOrderNo?: string | null;
  erpOrderId?: string | null;
}

export interface WorkflowLineSerialDetail extends BaseWorkflowLineSerialDetail {
  lineId: number;
}

export interface WorkflowRouteDetail extends BaseWorkflowRouteDetail {
  importLineId: number;
  yapKod?: string | null;
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
