import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { WorkflowCreateScreen } from '@/features/operations/screens/WorkflowCreateScreen';
import { getWorkflowModule } from '@/features/operations/config/workflow-modules';
import { GoodsReceiptCreateScreen } from '@/features/goods-receipt-create/GoodsReceiptCreateScreen';
import { WorkflowOrderCreateScreen } from '@/features/workflow-create/WorkflowOrderCreateScreen';

export default function WorkflowCreateRoute(): React.ReactElement {
  const params = useLocalSearchParams<{ module?: string | string[] }>();
  const moduleKey = Array.isArray(params.module) ? params.module[0] : params.module;
  const module = getWorkflowModule(moduleKey);

  if (!module) {
    return <Redirect href='/(tabs)/operations' />;
  }

  if (module.key === 'goods-receipt') {
    return <GoodsReceiptCreateScreen forcedMode='order' lockMode />;
  }

  if (
    module.key === 'transfer' ||
    module.key === 'warehouse-inbound' ||
    module.key === 'warehouse-outbound' ||
    module.key === 'shipment' ||
    module.key === 'subcontracting-issue' ||
    module.key === 'subcontracting-receipt'
  ) {
    return <WorkflowOrderCreateScreen module={module} forcedMode='order' lockMode />;
  }

  return <WorkflowCreateScreen module={module} />;
}
