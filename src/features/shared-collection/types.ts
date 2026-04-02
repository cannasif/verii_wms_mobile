import type { ApiRequestOptions } from '@/lib/request-utils';

export interface CollectionStockBarcode {
  barkod: string;
  stokKodu: string;
  stokAdi: string;
  olcuAdi: string;
  yapKod: string | null;
  yapAcik: string | null;
}

export interface CollectionLine {
  id: number;
  stockCode: string;
  stockName: string;
  quantity: number;
  unit: string;
}

export interface CollectionRoute {
  id: number;
  scannedBarcode?: string | null;
  quantity: number;
  serialNo?: string | null;
  stockCode?: string | null;
  description?: string | null;
}

export interface CollectionImportLine {
  lineId: number;
}

export interface CollectionCollectedItem {
  importLine: CollectionImportLine;
  routes: CollectionRoute[];
}

export interface CollectionApi {
  getAssignedOrderLines: (headerId: number, options?: ApiRequestOptions) => Promise<{ lines: CollectionLine[] }>;
  getStokBarcode: (barcode: string, barcodeGroup?: string, options?: ApiRequestOptions) => Promise<CollectionStockBarcode[]>;
  addBarcodeToOrder: (request: {
    headerId: number;
    lineId: number;
    barcode: string;
    stockCode: string;
    stockName: string;
    yapKod: string;
    yapAcik: string;
    quantity: number;
    serialNo: string;
    serialNo2: string;
    serialNo3: string;
    serialNo4: string;
    sourceCellCode: string;
    targetCellCode: string;
  }) => Promise<void>;
  getCollectedBarcodes: (headerId: number, options?: ApiRequestOptions) => Promise<CollectionCollectedItem[]>;
  complete: (headerId: number) => Promise<void>;
}

export interface CollectionHeaderInfo {
  title?: string;
  subtitle?: string;
  customerCode?: string;
  customerName?: string;
  projectCode?: string;
  sourceWarehouse?: string;
  targetWarehouse?: string;
  documentType?: string;
  documentDate?: string;
}
