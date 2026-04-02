import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { getWorkflowModule } from '@/features/operations/config/workflow-modules';
import { WorkflowDetailScreen } from '@/features/operations/screens/WorkflowDetailScreen';

export default function WorkflowDetailRoute(): React.ReactElement {
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
  const module = getWorkflowModule(moduleKey);
  const headerIdValue = Array.isArray(params.headerId) ? params.headerId[0] : params.headerId;
  const headerId = Number(headerIdValue);

  if (!module || !Number.isFinite(headerId) || headerId <= 0) {
    return <Redirect href='/(tabs)/operations' />;
  }

  return (
    <WorkflowDetailScreen
      module={module}
      headerId={headerId}
      fallbackInfo={{
        title: Array.isArray(params.title) ? params.title[0] : params.title,
        subtitle: Array.isArray(params.subtitle) ? params.subtitle[0] : params.subtitle,
        customerCode: Array.isArray(params.customerCode) ? params.customerCode[0] : params.customerCode,
        customerName: Array.isArray(params.customerName) ? params.customerName[0] : params.customerName,
        projectCode: Array.isArray(params.projectCode) ? params.projectCode[0] : params.projectCode,
        sourceWarehouse: Array.isArray(params.sourceWarehouse) ? params.sourceWarehouse[0] : params.sourceWarehouse,
        targetWarehouse: Array.isArray(params.targetWarehouse) ? params.targetWarehouse[0] : params.targetWarehouse,
        documentType: Array.isArray(params.documentType) ? params.documentType[0] : params.documentType,
        documentDate: Array.isArray(params.documentDate) ? params.documentDate[0] : params.documentDate,
      }}
    />
  );
}
