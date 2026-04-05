import type { WorkflowModuleKey } from '@/features/operations/types/workflow';
import type { BaseSelectedStockItem, BaseWorkflowOrder, BaseWorkflowOrderItem } from '@/types/document-models';

export type CreateWorkflowMode = 'order' | 'free';

export interface CustomerOption {
  id: number;
  cariKod: string;
  cariIsim: string;
}

export interface ProjectOption {
  projeKod: string;
  projeAciklama: string;
}

export interface WarehouseOption {
  id: number;
  depoKodu: number;
  depoIsmi: string;
}

export interface ProductOption {
  id: number;
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

export interface YapKodOption {
  id: number;
  yapKod: string;
  yapAcik: string;
  yplndrStokKod?: string;
}

export interface ActiveUserOption {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
}

export interface WorkflowOrder extends BaseWorkflowOrder {}

export interface WorkflowOrderItem extends BaseWorkflowOrderItem {
  yapKodId?: number;
  yapKod?: string;
  yapAcik?: string;
  unit?: string;
}

export interface SelectedWorkflowOrderItem extends WorkflowOrderItem {
  id: string;
  stockId?: number;
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

export interface SelectedWorkflowStockItem extends BaseSelectedStockItem {
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
  customerRefId?: number;
  sourceWarehouse: string;
  sourceWarehouseRefId?: number;
  targetWarehouse: string;
  targetWarehouseRefId?: number;
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
