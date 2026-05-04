import React from 'react';
import { useTranslation } from 'react-i18next';
import { GenericCollectionScreen } from '@/features/shared-collection/GenericCollectionScreen';
import { GenericCollectedScreen } from '@/features/shared-collection/GenericCollectedScreen';
import type { CollectionHeaderInfo } from '@/features/shared-collection/types';
import { shipmentCollectionApi } from './api';

export function ShipmentCollectionScreen({
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
      modulePath='shipment'
      titleKey='shipmentCollection.title'
      subtitleKey='shipmentCollection.subtitle'
      barcodeTitleKey='shipmentCollection.barcodeTitle'
      barcodePlaceholderKey='shipmentCollection.barcodePlaceholder'
      barcodeValueKey='shipmentCollection.barcodeValue'
      quantityPlaceholderKey='shipmentCollection.quantityPlaceholder'
      collectButtonKey='shipmentCollection.collectButton'
      collectSuccessTitleKey='shipmentCollection.collectSuccessTitle'
      collectSuccessTextKey='shipmentCollection.collectSuccessText'
      enterBarcodeKey='shipmentCollection.enterBarcode'
      selectStockKey='shipmentCollection.selectStock'
      invalidQuantityKey='shipmentCollection.invalidQuantity'
      stockNotInOrderKey='shipmentCollection.stockNotInOrder'
      linesTitleKey='shipmentCollection.linesTitle'
      lineTotalKey='shipmentCollection.lineTotal'
      lineCollectedKey='shipmentCollection.lineCollected'
      lineRemainingKey='shipmentCollection.lineRemaining'
      completeButtonKey='shipmentCollection.completeButton'
      completeSuccessTitleKey='shipmentCollection.completeSuccessTitle'
      completeSuccessTextKey='shipmentCollection.completeSuccessText'
      viewCollectedKey='shipmentCollection.viewCollected'
      updatePermissionCode='wms.shipment.update'
      api={shipmentCollectionApi}
      heroEyebrow={t('workflow.shipment.title')}
    />
  );
}

export function ShipmentCollectedScreen({ headerId }: { headerId: number }): React.ReactElement {
  return (
    <GenericCollectedScreen
      headerId={headerId}
      titleKey='shipmentCollection.collectedTitle'
      subtitleKey='shipmentCollection.collectedSubtitle'
      noCollectedKey='shipmentCollection.noCollected'
      barcodeValueKey='shipmentCollection.barcodeValue'
      collectedStockCodeKey='shipmentCollection.collectedStockCode'
      collectedSerialNoKey='shipmentCollection.collectedSerialNo'
      api={shipmentCollectionApi}
      queryKeyPrefix='shipment'
    />
  );
}
