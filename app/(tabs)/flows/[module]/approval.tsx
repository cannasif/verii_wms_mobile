import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { getWorkflowModule } from '@/features/operations/config/workflow-modules';
import { WorkflowApprovalScreen } from '@/features/operations/screens/WorkflowApprovalScreen';

export default function WorkflowApprovalRoute(): React.ReactElement {
  const params = useLocalSearchParams<{ module?: string | string[] }>();
  const moduleKey = Array.isArray(params.module) ? params.module[0] : params.module;
  const module = getWorkflowModule(moduleKey);

  if (!module) {
    return <Redirect href='/(tabs)/operations' />;
  }

  return <WorkflowApprovalScreen module={module} />;
}
