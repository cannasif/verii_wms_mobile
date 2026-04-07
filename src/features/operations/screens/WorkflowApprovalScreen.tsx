import React from 'react';
import type { WorkflowModuleConfig } from '../types/workflow';
import { WorkflowHeaderListScreen } from './WorkflowHeaderListScreen';

export function WorkflowApprovalScreen({ module }: { module: WorkflowModuleConfig }): React.ReactElement {
  return <WorkflowHeaderListScreen module={module} mode="approval" />;
}
