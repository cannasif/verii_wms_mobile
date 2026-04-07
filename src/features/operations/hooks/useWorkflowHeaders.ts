import { useAuthStore } from '@/store/auth';
import { usePagedFlatList } from '@/hooks/usePagedFlatList';
import { getWorkflowModule } from '../config/workflow-modules';
import { workflowApi } from '../api/workflow-api';
import type { WorkflowHeaderMode, WorkflowModuleKey } from '../types/workflow';

export function useWorkflowHeaders(moduleKey: WorkflowModuleKey, mode: WorkflowHeaderMode) {
  const userId = useAuthStore((state) => state.user?.id);
  const module = getWorkflowModule(moduleKey);

  return usePagedFlatList({
    queryKey: ['workflow', moduleKey, mode, userId ?? 0],
    enabled: Boolean(module) && (mode === 'list' || mode === 'approval' || Boolean(userId)),
    pageSize: 20,
    defaultSortBy: 'Id',
    defaultSortDirection: 'desc',
    defaultFilterColumn: module?.defaultFilterColumn,
    columns: module?.filterColumns ?? [],
    fetchPage: (params) => {
      if (mode === 'assigned') {
        return workflowApi.getAssignedHeaders(moduleKey, userId ?? 0, params);
      }

      if (mode === 'approval') {
        return workflowApi.getApprovalHeaders(moduleKey, params);
      }

      return workflowApi.getHeaders(moduleKey, params);
    },
  });
}
