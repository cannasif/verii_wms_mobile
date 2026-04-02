import { useAuthStore } from '@/store/auth';
import { usePagedFlatList } from '@/hooks/usePagedFlatList';
import { getWorkflowModule } from '../config/workflow-modules';
import { workflowApi } from '../api/workflow-api';
import type { WorkflowModuleKey } from '../types/workflow';

type WorkflowHeaderMode = 'assigned' | 'list';

export function useWorkflowHeaders(moduleKey: WorkflowModuleKey, mode: WorkflowHeaderMode) {
  const userId = useAuthStore((state) => state.user?.id);
  const module = getWorkflowModule(moduleKey);

  return usePagedFlatList({
    queryKey: ['workflow', moduleKey, mode, userId ?? 0],
    enabled: Boolean(module) && (mode === 'list' || Boolean(userId)),
    pageSize: 20,
    defaultSortBy: 'Id',
    defaultSortDirection: 'desc',
    defaultFilterColumn: module?.defaultFilterColumn,
    columns: module?.filterColumns ?? [],
    fetchPage: (params) =>
      mode === 'assigned'
        ? workflowApi.getAssignedHeaders(moduleKey, userId ?? 0, params)
        : workflowApi.getHeaders(moduleKey, params),
  });
}
