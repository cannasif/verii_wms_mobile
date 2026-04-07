import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { getWorkflowModule } from '@/features/operations/config/workflow-modules';
import { GoodsReceiptCreateScreen } from '@/features/goods-receipt-create/GoodsReceiptCreateScreen';
import { WorkflowOrderCreateScreen } from '@/features/workflow-create/WorkflowOrderCreateScreen';

function supportsProcess(moduleKey: string | undefined): boolean {
  return (
    moduleKey === 'goods-receipt' ||
    moduleKey === 'transfer' ||
    moduleKey === 'warehouse-inbound' ||
    moduleKey === 'warehouse-outbound' ||
    moduleKey === 'shipment' ||
    moduleKey === 'subcontracting-issue' ||
    moduleKey === 'subcontracting-receipt'
  );
}

function getProcessTranslationBase(moduleKey: string): string {
  switch (moduleKey) {
    case 'goods-receipt':
      return 'workflow.goodsReceipt';
    case 'transfer':
      return 'workflow.transfer';
    case 'warehouse-inbound':
      return 'workflow.warehouseInbound';
    case 'warehouse-outbound':
      return 'workflow.warehouseOutbound';
    case 'shipment':
      return 'workflow.shipment';
    case 'subcontracting-issue':
      return 'workflow.subcontractingIssue';
    case 'subcontracting-receipt':
      return 'workflow.subcontractingReceipt';
    default:
      return 'workflow.transfer';
  }
}

export default function WorkflowProcessRoute(): React.ReactElement {
  const params = useLocalSearchParams<{ module?: string | string[] }>();
  const moduleKey = Array.isArray(params.module) ? params.module[0] : params.module;
  const module = getWorkflowModule(moduleKey);

  if (!module || !supportsProcess(module.key)) {
    return <Redirect href='/(tabs)/operations' />;
  }

  if (module.key === 'goods-receipt') {
    return <GoodsReceiptCreateScreen forcedMode='stock' lockMode />;
  }

  const translationBase = getProcessTranslationBase(module.key);

  return (
    <WorkflowOrderCreateScreen
      module={module}
      forcedMode='free'
      lockMode
      titleKey={`${translationBase}.processTitle`}
      subtitleKey={`${translationBase}.processDescription`}
    />
  );
}
