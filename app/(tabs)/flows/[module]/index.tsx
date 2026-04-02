import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { WorkflowModuleScreen } from '@/features/operations/screens/WorkflowModuleScreen';
import { getWorkflowModule } from '@/features/operations/config/workflow-modules';

export default function WorkflowModuleRoute(): React.ReactElement {
  const params = useLocalSearchParams<{ module?: string | string[] }>();
  const moduleKey = Array.isArray(params.module) ? params.module[0] : params.module;
  const module = getWorkflowModule(moduleKey);

  if (!module) {
    return <Redirect href='/(tabs)/operations' />;
  }

  return <WorkflowModuleScreen module={module} />;
}
