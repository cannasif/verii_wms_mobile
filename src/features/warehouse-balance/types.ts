import type { FilterColumnConfig } from '@/types/paged';

export interface WarehouseStockBalanceItem {
  id: number;
  branchCode: string;
  warehouseId: number;
  warehouseCode?: string | null;
  warehouseName?: string | null;
  stockId: number;
  stockCode?: string | null;
  stockName?: string | null;
  yapKodId?: number | null;
  yapKodCode?: string | null;
  yapKodName?: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  distinctSerialCount: number;
  distinctShelfCount: number;
  lastTransactionDate?: string | null;
  lastRecalculatedAt?: string | null;
}

export interface WarehouseStockSerialBalanceItem {
  id: number;
  branchCode: string;
  warehouseId: number;
  warehouseCode?: string | null;
  warehouseName?: string | null;
  shelfId?: number | null;
  shelfCode?: string | null;
  shelfName?: string | null;
  stockId: number;
  stockCode?: string | null;
  stockName?: string | null;
  yapKodId?: number | null;
  yapKodCode?: string | null;
  yapKodName?: string | null;
  serialNo?: string | null;
  serialNo2?: string | null;
  serialNo3?: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  stockStatus?: string | null;
  lastTransactionDate?: string | null;
}

export const warehouseStockBalanceFilters: readonly FilterColumnConfig[] = [
  { value: 'stockCode', type: 'text', labelKey: 'inventoryMobile.filters.stockCode' },
  { value: 'stockName', type: 'text', labelKey: 'inventoryMobile.filters.stockName' },
  { value: 'warehouseName', type: 'text', labelKey: 'inventoryMobile.filters.warehouse', operators: ['Equals', 'Contains'] },
  { value: 'WarehouseId', type: 'number', labelKey: 'inventoryMobile.filters.warehouseId', operators: ['Equals'] },
  { value: 'yapKodCode', type: 'text', labelKey: 'inventoryMobile.filters.yapKod' },
] as const;

export const warehouseSerialBalanceFilters: readonly FilterColumnConfig[] = [
  { value: 'stockCode', type: 'text', labelKey: 'inventoryMobile.filters.stockCode' },
  { value: 'stockName', type: 'text', labelKey: 'inventoryMobile.filters.stockName' },
  { value: 'warehouseName', type: 'text', labelKey: 'inventoryMobile.filters.warehouse', operators: ['Equals', 'Contains'] },
  { value: 'WarehouseId', type: 'number', labelKey: 'inventoryMobile.filters.warehouseId', operators: ['Equals'] },
  { value: 'shelfCode', type: 'text', labelKey: 'inventoryMobile.filters.shelf' },
  { value: 'serialNo', type: 'text', labelKey: 'inventoryMobile.filters.serialNo' },
] as const;
