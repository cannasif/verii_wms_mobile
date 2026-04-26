import type { GoodsReceiptFormValues } from '../types';

export type GoodsReceiptScanDraft = Partial<
  Pick<GoodsReceiptFormValues, 'receiptDate' | 'documentNo' | 'notes' | 'customerId' | 'projectCode' | 'isInvoice'>
>;

export const GOODS_RECEIPT_DOCUMENT_SCAN_ENABLED = false;

export async function scanGoodsReceiptDocument(
  _photoUri: string,
  _options?: { signal?: AbortSignal },
): Promise<GoodsReceiptScanDraft> {
  if (!GOODS_RECEIPT_DOCUMENT_SCAN_ENABLED) {
    return {};
  }

  return {};
}
