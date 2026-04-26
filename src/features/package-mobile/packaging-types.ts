/**
 * Packaging create/read DTOs — JSON camelCase, aligned with verii_wms_api.
 * Optional fields use `?:` so callers may omit keys entirely.
 */

export type PackagingSourceType = 'GR' | 'WT' | 'PR' | 'PT' | 'SIT' | 'SRT' | 'WI' | 'WO' | 'SH';

export const PACKAGING_SOURCE_TYPES: readonly PackagingSourceType[] = [
  'GR',
  'WT',
  'PR',
  'PT',
  'SIT',
  'SRT',
  'WI',
  'WO',
  'SH',
] as const;

export type PackagingPackageType = 'Box' | 'Pallet' | 'Bag' | 'Custom';

export const PACKAGING_PACKAGE_TYPES: readonly PackagingPackageType[] = ['Box', 'Pallet', 'Bag', 'Custom'] as const;

/** POST /api/PHeader */
export interface CreatePHeaderDto {
  warehouseCode?: string | null;
  warehouseId?: number | null;
  packingNo: string;
  packingDate?: string | null;
  sourceType?: string | null;
  sourceHeaderId?: number | null;
  customerCode?: string | null;
  customerId?: number | null;
  customerAddress?: string | null;
  status?: string | null;
  totalPackageCount?: number | null;
  totalQuantity?: number | null;
  totalNetWeight?: number | null;
  totalGrossWeight?: number | null;
  totalVolume?: number | null;
  carrierId?: number | null;
  carrierServiceType?: string | null;
  trackingNo?: string | null;
  isMatched?: boolean | null;
}

/** POST /api/PHeader success body */
export interface PHeaderDto {
  id: number;
  packingNo: string;
  status?: string | null;
  warehouseId?: number | null;
  warehouseCode?: string | null;
  packingDate?: string | null;
  sourceType?: string | null;
  sourceHeaderId?: number | null;
  customerCode?: string | null;
  customerId?: number | null;
  customerAddress?: string | null;
  isMatched?: boolean | null;
  totalPackageCount?: number | null;
  totalQuantity?: number | null;
}

/** POST /api/PPackage */
export interface CreatePPackageDto {
  packingHeaderId: number;
  parentPackageId?: number | null;
  packagingMaterialId?: number | null;
  currentWarehouseId?: number | null;
  currentShelfId?: number | null;
  packageNo: string;
  packageType?: string | null;
  barcode?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  volume?: number | null;
  netWeight?: number | null;
  tareWeight?: number | null;
  grossWeight?: number | null;
  isMixed?: boolean | null;
  status?: string | null;
}

/** POST /api/PPackage success body */
export interface PPackageDto {
  id: number;
  packingHeaderId: number;
  parentPackageId?: number | null;
  packageNo: string;
  packageType?: string | null;
  barcode?: string | null;
  status?: string | null;
  currentWarehouseId?: number | null;
  currentShelfId?: number | null;
  packagingMaterialId?: number | null;
}

/** POST /api/PLine */
export interface CreatePLineDto {
  packingHeaderId: number;
  packageId: number;
  barcode?: string | null;
  stockCode: string;
  stockId?: number | null;
  yapKodId?: number | null;
  quantity: number;
  serialNo?: string | null;
  serialNo2?: string | null;
  serialNo3?: string | null;
  serialNo4?: string | null;
  sourceRouteId?: number | null;
}

/** POST /api/PLine success / GET line rows */
export interface PLineDto {
  id: number;
  packingHeaderId: number;
  packageId: number;
  stockCode?: string | null;
  stockId?: number | null;
  yapKodId?: number | null;
  quantity: number;
  barcode?: string | null;
  serialNo?: string | null;
  serialNo2?: string | null;
  serialNo3?: string | null;
  serialNo4?: string | null;
  sourceRouteId?: number | null;
}

/** POST /api/PackageOperations/auto-package-from-source */
export interface AutoPackageFromSourceRequestDto {
  sourceType: string;
  sourceHeaderId: number;
  autoMatch?: boolean;
  createPallets?: boolean;
  reuseExistingPackingHeader?: boolean;
}

export interface AutoPackageFromSourceResultDto {
  packingHeaderId: number;
  packingNo: string;
  createdPackageCount: number;
  createdLineCount: number;
  createdPalletCount: number;
  createdBoxCount: number;
}
