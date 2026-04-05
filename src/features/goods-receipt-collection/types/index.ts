import type {
  BaseWorkflowImportLineDetail,
  BaseWorkflowRouteDetail,
} from '@/features/operations/types/detail-models';

export interface AssignedGrLine {
  id: number;
  stockCode: string;
  stockName: string;
  yapKod: string | null;
  quantity: number;
  unit: string;
  erpOrderNo: string;
  erpOrderId: string;
  description: string;
  headerId: number;
  orderId: number | null;
}

export interface AssignedGrOrderLinesData {
  lines: AssignedGrLine[];
}

export interface StokBarcodeDto {
  barkod: string;
  stokKodu: string;
  stokAdi: string;
  depoKodu: string | null;
  depoAdi: string | null;
  rafKodu: string | null;
  yapilandir: string;
  olcuBr: number;
  olcuAdi: string;
  yapKod: string | null;
  yapAcik: string | null;
  cevrim: number;
  seriBarkodMu: boolean;
  sktVarmi: string | null;
  isemriNo: string | null;
}

export interface AddBarcodeRequest {
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
}

export interface GrImportRoute extends BaseWorkflowRouteDetail {}

export interface GrImportLine extends Pick<BaseWorkflowImportLineDetail, 'lineId'> {
  lineId: number;
}

export interface CollectedBarcodeItem {
  importLine: GrImportLine;
  routes: GrImportRoute[];
}
