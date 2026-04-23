import type { FilterColumnConfig } from '@/types/paged';

export interface MobilePackageHeaderItem {
  id: number;
  warehouseCode?: string | null;
  warehouseId?: number | null;
  packingNo: string;
  packingDate?: string | null;
  sourceType?: 'GR' | 'WT' | 'PR' | 'PT' | 'SIT' | 'SRT' | 'WI' | 'WO' | 'SH' | null;
  sourceHeaderId?: number | null;
  customerCode?: string | null;
  customerName?: string | null;
  customerAddress?: string | null;
  status: string;
  totalPackageCount?: number | null;
  totalQuantity?: number | null;
  totalNetWeight?: number | null;
  totalGrossWeight?: number | null;
  totalVolume?: number | null;
  trackingNo?: string | null;
  isMatched: boolean;
  createdDate?: string | null;
}

export interface MobilePackageTreeNode {
  package: MobilePackageItem;
  children: MobilePackageTreeNode[];
}

export interface MovePackagesToSourceHeaderDto {
  targetSourceType: 'WT' | 'SH';
  targetSourceHeaderId: number;
  packageIds: number[];
  targetWarehouseId?: number | null;
  targetShelfId?: number | null;
  targetPackageStatus?: string | null;
  note?: string | null;
}

export interface PackageMoveResultDto {
  targetPackingHeaderId: number;
  targetWarehouseId?: number | null;
  targetShelfId?: number | null;
  packageCount: number;
  lineCount: number;
  movedPackageIds: number[];
}

export interface MobilePackageItem {
  id: number;
  packingHeaderId: number;
  parentPackageId?: number | null;
  parentPackageNo?: string | null;
  packagingMaterialId?: number | null;
  packagingMaterialCode?: string | null;
  packagingMaterialName?: string | null;
  currentWarehouseId?: number | null;
  currentWarehouseCode?: string | null;
  currentWarehouseName?: string | null;
  currentShelfId?: number | null;
  currentShelfCode?: string | null;
  currentShelfName?: string | null;
  packageNo: string;
  packageType: string;
  barcode?: string | null;
  totalChildPackageCount?: number;
  totalProductQuantity?: number;
  totalNetWeight?: number;
  totalGrossWeight?: number;
  totalVolume?: number;
  status: string;
}

export const packageHeaderFilters: readonly FilterColumnConfig[] = [
  { value: 'packingNo', type: 'text', labelKey: 'packageMobile.filters.packingNo' },
  { value: 'customerCode', type: 'text', labelKey: 'packageMobile.filters.customerCode' },
  { value: 'customerName', type: 'text', labelKey: 'packageMobile.filters.customerName' },
  { value: 'warehouseCode', type: 'text', labelKey: 'packageMobile.filters.warehouse' },
  { value: 'sourceType', type: 'text', labelKey: 'packageMobile.filters.sourceType' },
  { value: 'status', type: 'text', labelKey: 'packageMobile.filters.status' },
] as const;
