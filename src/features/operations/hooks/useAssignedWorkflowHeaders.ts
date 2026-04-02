import { useWorkflowHeaders } from './useWorkflowHeaders';
import type { WorkflowModuleKey } from '../types/workflow';

export function useAssignedWorkflowHeaders(moduleKey: WorkflowModuleKey) {
  return useWorkflowHeaders(moduleKey, 'assigned');
}
