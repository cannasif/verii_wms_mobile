import React from 'react';
import { useTranslation } from 'react-i18next';
import { GenericCollectionScreen } from '@/features/shared-collection/GenericCollectionScreen';
import type { CollectionHeaderInfo } from '@/features/shared-collection/types';
import { transferCollectionApi } from './api';

export function TransferCollectionScreen({
  headerId,
  headerInfo,
}: {
  headerId: number;
  headerInfo?: CollectionHeaderInfo | null;
}): React.ReactElement {
  const { t } = useTranslation();
  return (
    <GenericCollectionScreen
      headerId={headerId}
      headerInfo={headerInfo}
      modulePath='transfer'
      titleKey='transferCollection.title'
      subtitleKey='transferCollection.subtitle'
      barcodeTitleKey='transferCollection.barcodeTitle'
      barcodePlaceholderKey='transferCollection.barcodePlaceholder'
      barcodeValueKey='transferCollection.barcodeValue'
      quantityPlaceholderKey='transferCollection.quantityPlaceholder'
      collectButtonKey='transferCollection.collectButton'
      collectSuccessTitleKey='transferCollection.collectSuccessTitle'
      collectSuccessTextKey='transferCollection.collectSuccessText'
      enterBarcodeKey='transferCollection.enterBarcode'
      selectStockKey='transferCollection.selectStock'
      invalidQuantityKey='transferCollection.invalidQuantity'
      stockNotInOrderKey='transferCollection.stockNotInOrder'
      linesTitleKey='transferCollection.linesTitle'
      lineTotalKey='transferCollection.lineTotal'
      lineCollectedKey='transferCollection.lineCollected'
      lineRemainingKey='transferCollection.lineRemaining'
      completeButtonKey='transferCollection.completeButton'
      completeSuccessTitleKey='transferCollection.completeSuccessTitle'
      completeSuccessTextKey='transferCollection.completeSuccessText'
      viewCollectedKey='transferCollection.viewCollected'
      api={transferCollectionApi}
      heroEyebrow={t('workflow.transfer.title')}
    />
  );
}
