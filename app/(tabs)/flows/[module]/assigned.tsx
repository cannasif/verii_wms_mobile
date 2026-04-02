import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { WorkflowAssignedScreen } from '@/features/operations/screens/WorkflowAssignedScreen';
import { getWorkflowModule } from '@/features/operations/config/workflow-modules';

export default function WorkflowAssignedRoute(): React.ReactElement {
  const params = useLocalSearchParams<{ module?: string | string[] }>();
  const moduleKey = Array.isArray(params.module) ? params.module[0] : params.module;
  const module = getWorkflowModule(moduleKey);

  if (!module) {
    return <Redirect href='/(tabs)/operations' />;
  }

  return <WorkflowAssignedScreen module={module} />;
}
