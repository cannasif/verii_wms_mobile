import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { PackageMoveTreeScreen } from '@/features/package-mobile/screens/PackageMoveTreeScreen';

export default function WorkflowPackageMoveTreeRoute(): React.ReactElement {
  const params = useLocalSearchParams<{
    module?: string | string[];
    headerId?: string | string[];
    packingHeaderId?: string | string[];
    target?: string | string[];
  }>();

  const moduleKey = Array.isArray(params.module) ? params.module[0] : params.module;
  const headerIdValue = Array.isArray(params.headerId) ? params.headerId[0] : params.headerId;
  const packingHeaderIdValue = Array.isArray(params.packingHeaderId) ? params.packingHeaderId[0] : params.packingHeaderId;
  const target = Array.isArray(params.target) ? params.target[0] : params.target;
  const headerId = Number(headerIdValue);
  const packingHeaderId = Number(packingHeaderIdValue);

  if ((moduleKey !== 'transfer' && moduleKey !== 'shipment')
    || !Number.isFinite(headerId) || headerId <= 0
    || !Number.isFinite(packingHeaderId) || packingHeaderId <= 0) {
    return <Redirect href='/(tabs)/operations' />;
  }

  return (
    <PackageMoveTreeScreen
      moduleKey={moduleKey}
      targetSourceType={moduleKey === 'shipment' ? 'SH' : 'WT'}
      targetSourceHeaderId={headerId}
      sourcePackingHeaderId={packingHeaderId}
      targetLabel={target || `#${headerId}`}
    />
  );
}
