export interface AssignedTransferLine {
  id: number;
  stockCode: string;
  stockName: string;
  yapKod: string;
  yapAcik: string;
  quantity: number;
  unit: string;
  erpOrderNo: string;
  erpOrderId: string;
  description: string;
  headerId: number;
  orderId: number;
  erpLineReference: string;
}

export interface AssignedTransferOrderLinesData {
  lines: AssignedTransferLine[];
}

export interface StokBarcodeDto {
  barkod: string;
  stokKodu: string;
  stokAdi: string;
  olcuAdi: string;
  yapKod: string | null;
  yapAcik: string | null;
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

export interface AssignedTransferRoute {
  id: number;
  scannedBarcode: string;
  quantity: number;
  serialNo: string;
  stockCode: string;
  description: string;
}

export interface AssignedTransferImportLine {
  lineId: number;
}

export interface CollectedBarcodeItem {
  importLine: AssignedTransferImportLine;
  routes: AssignedTransferRoute[];
}
