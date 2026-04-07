import type { ApiRequestOptions } from '@/lib/request-utils';
import type { BarcodeDefinition } from '@/services/barcode-types';
import type {
  BaseWorkflowImportLineDetail,
  BaseWorkflowRouteDetail,
} from '@/features/operations/types/detail-models';

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
  stockCode?: string;
  stockName?: string;
  yapKod?: string | null;
  yapAcik?: string | null;
  quantity: number;
  unit: string;
}

export interface CollectionRoute extends BaseWorkflowRouteDetail {
  yapKod?: string | null;
  yapAcik?: string | null;
}

export interface CollectionImportLine extends Pick<BaseWorkflowImportLineDetail, 'lineId'> {
  lineId: number;
}

export interface CollectionCollectedItem {
  importLine: CollectionImportLine;
  routes: CollectionRoute[];
}

export interface CollectionApi {
  getAssignedOrderLines: (headerId: number, options?: ApiRequestOptions) => Promise<{ lines: CollectionLine[] }>;
  getStokBarcode: (barcode: string, options?: ApiRequestOptions) => Promise<CollectionStockBarcode[]>;
  getBarcodeDefinition?: (options?: ApiRequestOptions) => Promise<BarcodeDefinition>;
  addBarcodeToOrder: (request: {
    headerId: number;
    barcode: string;
    stockCode?: string;
    stockName?: string;
    yapKod?: string;
    yapAcik?: string;
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
