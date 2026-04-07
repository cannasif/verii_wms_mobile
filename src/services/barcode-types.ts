export interface BarcodeDefinition {
  moduleKey: string;
  displayName: string;
  format: string;
  isActive: boolean;
  enableErpFallback: boolean;
  hintText: string;
}

export interface BarcodeSegmentValue {
  name: string;
  value: string;
}

export interface BarcodeMatchCandidate {
  stockCode?: string | null;
  stockName?: string | null;
  yapKod?: string | null;
  yapAcik?: string | null;
  serialNumber?: string | null;
}

export interface ResolvedBarcode {
  moduleKey: string;
  barcode: string;
  stockCode?: string | null;
  stockName?: string | null;
  yapKod?: string | null;
  yapAcik?: string | null;
  serialNumber?: string | null;
  quantity?: number | null;
  source?: string | null;
  definitionFormat?: string | null;
  reasonCode: number;
  segments: BarcodeSegmentValue[];
  candidates: BarcodeMatchCandidate[];
}
