import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { getWorkflowModule } from '@/features/operations/config/workflow-modules';
import { GoodsReceiptCollectedScreen } from '@/features/goods-receipt-collection/GoodsReceiptCollectedScreen';
import { ShipmentCollectedScreen } from '@/features/shipment-collection/ShipmentCollectionScreen';
import { SubcontractingCollectedScreen } from '@/features/subcontracting-collection/SubcontractingCollectionScreen';
import { GenericCollectedScreen } from '@/features/shared-collection/GenericCollectedScreen';
import { transferCollectionApi } from '@/features/transfer-collection/api';

export default function WorkflowCollectedRoute(): React.ReactElement {
  const params = useLocalSearchParams<{ module?: string | string[]; headerId?: string | string[] }>();
  const moduleKey = Array.isArray(params.module) ? params.module[0] : params.module;
  const headerIdRaw = Array.isArray(params.headerId) ? params.headerId[0] : params.headerId;
  const module = getWorkflowModule(moduleKey);
  const headerId = Number(headerIdRaw);

  if (!module || !headerIdRaw || Number.isNaN(headerId)) {
    return <Redirect href='/(tabs)/operations' />;
  }

  if (module.key === 'goods-receipt') {
    return <GoodsReceiptCollectedScreen headerId={headerId} />;
  }

  if (module.key === 'transfer') {
    return (
      <GenericCollectedScreen
        headerId={headerId}
        titleKey='transferCollection.collectedTitle'
        subtitleKey='transferCollection.collectedSubtitle'
        noCollectedKey='transferCollection.noCollected'
        barcodeValueKey='transferCollection.barcodeValue'
        collectedStockCodeKey='transferCollection.collectedStockCode'
        collectedSerialNoKey='transferCollection.collectedSerialNo'
        api={transferCollectionApi}
        queryKeyPrefix='transfer'
      />
    );
  }

  if (module.key === 'shipment') {
    return <ShipmentCollectedScreen headerId={headerId} />;
  }

  if (module.key === 'subcontracting-issue') {
    return <SubcontractingCollectedScreen headerId={headerId} kind='issue' />;
  }

  if (module.key === 'subcontracting-receipt') {
    return <SubcontractingCollectedScreen headerId={headerId} kind='receipt' />;
  }

  return <Redirect href={`/(tabs)/flows/${module.key}/assigned` as never} />;
}
