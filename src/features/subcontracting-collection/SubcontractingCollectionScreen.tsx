import React from 'react';
import { useTranslation } from 'react-i18next';
import { GenericCollectionScreen } from '@/features/shared-collection/GenericCollectionScreen';
import { GenericCollectedScreen } from '@/features/shared-collection/GenericCollectedScreen';
import type { CollectionHeaderInfo } from '@/features/shared-collection/types';
import { createSubcontractingCollectionApi } from './api';

export function SubcontractingCollectionScreen({
  headerId,
  kind,
  headerInfo,
}: {
  headerId: number;
  kind: 'issue' | 'receipt';
  headerInfo?: CollectionHeaderInfo | null;
}): React.ReactElement {
  const { t } = useTranslation();
  const api = createSubcontractingCollectionApi(kind);
  const prefix = kind === 'issue' ? 'subcontractingIssueCollection' : 'subcontractingReceiptCollection';
  const modulePath = kind === 'issue' ? 'subcontracting-issue' : 'subcontracting-receipt';
  const heroEyebrow = kind === 'issue' ? t('workflow.subcontractingIssue.title') : t('workflow.subcontractingReceipt.title');

  return (
    <GenericCollectionScreen
      headerId={headerId}
      headerInfo={headerInfo}
      modulePath={modulePath}
      titleKey={`${prefix}.title`}
      subtitleKey={`${prefix}.subtitle`}
      barcodeTitleKey={`${prefix}.barcodeTitle`}
      barcodePlaceholderKey={`${prefix}.barcodePlaceholder`}
      barcodeValueKey={`${prefix}.barcodeValue`}
      quantityPlaceholderKey={`${prefix}.quantityPlaceholder`}
      collectButtonKey={`${prefix}.collectButton`}
      collectSuccessTitleKey={`${prefix}.collectSuccessTitle`}
      collectSuccessTextKey={`${prefix}.collectSuccessText`}
      enterBarcodeKey={`${prefix}.enterBarcode`}
      selectStockKey={`${prefix}.selectStock`}
      invalidQuantityKey={`${prefix}.invalidQuantity`}
      stockNotInOrderKey={`${prefix}.stockNotInOrder`}
      linesTitleKey={`${prefix}.linesTitle`}
      lineTotalKey={`${prefix}.lineTotal`}
      lineCollectedKey={`${prefix}.lineCollected`}
      lineRemainingKey={`${prefix}.lineRemaining`}
      completeButtonKey={`${prefix}.completeButton`}
      completeSuccessTitleKey={`${prefix}.completeSuccessTitle`}
      completeSuccessTextKey={`${prefix}.completeSuccessText`}
      viewCollectedKey={`${prefix}.viewCollected`}
      updatePermissionCode={kind === 'issue' ? 'wms.subcontracting.issue.update' : 'wms.subcontracting.receipt.update'}
      api={api}
      heroEyebrow={heroEyebrow}
    />
  );
}

export function SubcontractingCollectedScreen({
  headerId,
  kind,
}: {
  headerId: number;
  kind: 'issue' | 'receipt';
}): React.ReactElement {
  const api = createSubcontractingCollectionApi(kind);
  const prefix = kind === 'issue' ? 'subcontractingIssueCollection' : 'subcontractingReceiptCollection';
  const queryKeyPrefix = kind === 'issue' ? 'subcontracting-issue' : 'subcontracting-receipt';

  return (
    <GenericCollectedScreen
      headerId={headerId}
      titleKey={`${prefix}.collectedTitle`}
      subtitleKey={`${prefix}.collectedSubtitle`}
      noCollectedKey={`${prefix}.noCollected`}
      barcodeValueKey={`${prefix}.barcodeValue`}
      collectedStockCodeKey={`${prefix}.collectedStockCode`}
      collectedSerialNoKey={`${prefix}.collectedSerialNo`}
      api={api}
      queryKeyPrefix={queryKeyPrefix}
    />
  );
}
