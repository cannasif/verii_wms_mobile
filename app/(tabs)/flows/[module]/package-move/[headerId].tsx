import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { PackageMoveSourcePickerScreen } from '@/features/package-mobile/screens/PackageMoveSourcePickerScreen';

export default function WorkflowPackageMoveRoute(): React.ReactElement {
  const params = useLocalSearchParams<{
    module?: string | string[];
    headerId?: string | string[];
    target?: string | string[];
  }>();

  const moduleKey = Array.isArray(params.module) ? params.module[0] : params.module;
  const headerIdValue = Array.isArray(params.headerId) ? params.headerId[0] : params.headerId;
  const headerId = Number(headerIdValue);
  const target = Array.isArray(params.target) ? params.target[0] : params.target;

  if ((moduleKey !== 'transfer' && moduleKey !== 'shipment') || !Number.isFinite(headerId) || headerId <= 0) {
    return <Redirect href='/(tabs)/operations' />;
  }

  return (
    <PackageMoveSourcePickerScreen
      moduleKey={moduleKey}
      targetSourceType={moduleKey === 'shipment' ? 'SH' : 'WT'}
      targetSourceHeaderId={headerId}
      targetLabel={target || `#${headerId}`}
    />
  );
}
