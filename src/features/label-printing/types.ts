/** Request body for POST /api/PackageOperations/print-labels (JSON camelCase). */
export interface PackageLabelPrintRequest {
  printerDefinitionId: number;
  printerProfileId?: number | null;
  barcodeTemplateId: number;
  packageId?: number | null;
  packingHeaderId?: number | null;
  packageIds: number[];
  printMode: string;
  copies: number;
  includeChildren: boolean;
  useGs1SsccForPallets: boolean;
}

export interface PackageLabelPrintResult {
  printJobId?: number | null;
  printedPackageCount: number;
  printedPackageIds: number[];
  packingHeaderId?: number | null;
}

export interface PrinterDefinitionDto {
  id: number;
  name?: string | null;
  code?: string | null;
  isActive?: boolean;
  branchId?: number | null;
}

export interface PrinterProfileDto {
  id: number;
  printerDefinitionId: number;
  name?: string | null;
  outputType?: string | null;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface TemplatePrinterProfileDto {
  barcodeTemplateId: number;
  printerDefinitionId: number;
  printerProfileId: number;
  isDefault?: boolean;
}

export interface BarcodeTemplateListItem {
  id: number;
  name?: string | null;
  code?: string | null;
  publishedVersionId?: number | null;
}

export interface BarcodeDesignerPreviewRequest {
  templateId?: number;
  templateJson?: string;
  sourceModule: string;
  sourceLineId: number;
  printMode: string;
}

export interface BarcodeDesignerResolvePrintSourceRequest {
  sourceModule: string;
  sourceLineId: number;
  printMode: string;
}

export interface PrintJobStatusDto {
  status?: string | null;
  errorMessage?: string | null;
}
