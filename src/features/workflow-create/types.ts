import type { WorkflowModuleKey } from '@/features/operations/types/workflow';

export type CreateWorkflowMode = 'order' | 'free';

export interface CustomerOption {
  cariKod: string;
  cariIsim: string;
}

export interface ProjectOption {
  projeKod: string;
  projeAciklama: string;
}

export interface WarehouseOption {
  depoKodu: number;
  depoIsmi: string;
}

export interface ProductOption {
  stokKodu: string;
  stokAdi: string;
  olcuBr1: string;
}

export interface ProductBarcodeOption {
  barkod: string;
  stokKodu: string;
  stokAdi: string;
  olcuAdi: string;
  yapKod: string | null;
  yapAcik: string | null;
}

export interface ActiveUserOption {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
}

export interface WorkflowOrder {
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

export interface WorkflowOrderItem {
  id?: string;
  mode: string;
  siparisNo: string;
  orderID: number;
  stockCode: string;
  stockName: string;
  yapKod?: string;
  yapAcik?: string;
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
  unit?: string;
}

export interface SelectedWorkflowOrderItem extends WorkflowOrderItem {
  id: string;
  transferQuantity: number;
  isSelected: boolean;
  serialNo?: string;
  serialNo2?: string;
  lotNo?: string;
  batchNo?: string;
  configCode?: string;
  sourceWarehouse?: number;
  sourceCellCode?: string;
  targetCellCode?: string;
}

export interface SelectedWorkflowStockItem {
  id: string;
  stockCode: string;
  stockName: string;
  unit: string;
  yapKod?: string;
  yapAcik?: string;
  scannedBarcode?: string;
  transferQuantity: number;
  isSelected: boolean;
  serialNo?: string;
  serialNo2?: string;
  lotNo?: string;
  batchNo?: string;
  configCode?: string;
  sourceWarehouse?: number;
  sourceCellCode?: string;
  targetCellCode?: string;
}

export type SelectedWorkflowItem = SelectedWorkflowOrderItem | SelectedWorkflowStockItem;

export interface WorkflowCreateFormValues {
  transferDate: string;
  documentNo: string;
  projectCode: string;
  customerId: string;
  sourceWarehouse: string;
  targetWarehouse: string;
  notes: string;
  userIds: number[];
  operationType: string;
}

export interface WorkflowCreateModuleMeta {
  key: WorkflowModuleKey;
  supportsFreeMode: boolean;
  requiresCustomer: boolean;
  requiresSourceWarehouse: boolean;
  requiresTargetWarehouse: boolean;
  requiresOperationType: boolean;
  orderOnlyCustomerFlow: boolean;
}
