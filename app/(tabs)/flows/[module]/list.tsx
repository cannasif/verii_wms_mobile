import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { getWorkflowModule } from '@/features/operations/config/workflow-modules';
import { WorkflowHeaderListScreen } from '@/features/operations/screens/WorkflowHeaderListScreen';

export default function WorkflowListRoute(): React.ReactElement {
  const params = useLocalSearchParams<{ module?: string | string[] }>();
  const moduleKey = Array.isArray(params.module) ? params.module[0] : params.module;
  const module = getWorkflowModule(moduleKey);

  if (!module) {
    return <Redirect href='/(tabs)/operations' />;
  }

  return <WorkflowHeaderListScreen module={module} mode="list" />;
}
