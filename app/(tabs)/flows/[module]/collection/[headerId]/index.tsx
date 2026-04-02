import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { GoodsReceiptCollectionScreen } from '@/features/goods-receipt-collection/GoodsReceiptCollectionScreen';
import { getWorkflowModule } from '@/features/operations/config/workflow-modules';
import type { CollectionHeaderInfo } from '@/features/shared-collection/types';
import { TransferCollectionScreen } from '@/features/transfer-collection/TransferCollectionScreen';
import { ShipmentCollectionScreen } from '@/features/shipment-collection/ShipmentCollectionScreen';
import { SubcontractingCollectionScreen } from '@/features/subcontracting-collection/SubcontractingCollectionScreen';

export default function WorkflowCollectionRoute(): React.ReactElement {
  const params = useLocalSearchParams<{
    module?: string | string[];
    headerId?: string | string[];
    title?: string | string[];
    subtitle?: string | string[];
    customerCode?: string | string[];
    customerName?: string | string[];
    projectCode?: string | string[];
    sourceWarehouse?: string | string[];
    targetWarehouse?: string | string[];
    documentType?: string | string[];
    documentDate?: string | string[];
  }>();
  const moduleKey = Array.isArray(params.module) ? params.module[0] : params.module;
  const headerIdRaw = Array.isArray(params.headerId) ? params.headerId[0] : params.headerId;
  const module = getWorkflowModule(moduleKey);
  const headerId = Number(headerIdRaw);
  const getValue = (value?: string | string[]): string | undefined => (Array.isArray(value) ? value[0] : value) || undefined;
  const headerInfo: CollectionHeaderInfo = {
    title: getValue(params.title),
    subtitle: getValue(params.subtitle),
    customerCode: getValue(params.customerCode),
    customerName: getValue(params.customerName),
    projectCode: getValue(params.projectCode),
    sourceWarehouse: getValue(params.sourceWarehouse),
    targetWarehouse: getValue(params.targetWarehouse),
    documentType: getValue(params.documentType),
    documentDate: getValue(params.documentDate),
  };

  if (!module || !headerIdRaw || Number.isNaN(headerId)) {
    return <Redirect href='/(tabs)/operations' />;
  }

  if (module.key === 'transfer') {
    return <TransferCollectionScreen headerId={headerId} headerInfo={headerInfo} />;
  }

  if (module.key === 'shipment') {
    return <ShipmentCollectionScreen headerId={headerId} headerInfo={headerInfo} />;
  }

  if (module.key === 'subcontracting-issue') {
    return <SubcontractingCollectionScreen headerId={headerId} kind='issue' headerInfo={headerInfo} />;
  }

  if (module.key === 'subcontracting-receipt') {
    return <SubcontractingCollectionScreen headerId={headerId} kind='receipt' headerInfo={headerInfo} />;
  }

  if (module.key !== 'goods-receipt') {
    return <Redirect href={`/(tabs)/flows/${module.key}/assigned` as never} />;
  }

  return <GoodsReceiptCollectionScreen headerId={headerId} headerInfo={headerInfo} />;
}
