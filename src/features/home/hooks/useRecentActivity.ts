import { useQuery } from '@tanstack/react-query';
import { workflowApi } from '@/features/operations/api/workflow-api';
import type { WorkflowAssignedItem } from '@/features/operations/types/workflow';

export type RecentActivityItem = WorkflowAssignedItem & {
  moduleKey: 'goods-receipt' | 'transfer';
};

export function useRecentActivity() {
  return useQuery<RecentActivityItem[]>({
    queryKey: ['home', 'recent-activity'],
    staleTime: 1000 * 60 * 2,
    queryFn: async ({ signal }) => {
      const [receipt, transfer] = await Promise.allSettled([
        workflowApi.getHeaders('goods-receipt', { pageNumber: 1, pageSize: 3, sortBy: 'Id', sortDirection: 'desc' }, { signal }),
        workflowApi.getHeaders('transfer', { pageNumber: 1, pageSize: 3, sortBy: 'Id', sortDirection: 'desc' }, { signal }),
      ]);

      const receiptItems: RecentActivityItem[] =
        receipt.status === 'fulfilled'
          ? receipt.value.data.map((d) => ({ ...d, moduleKey: 'goods-receipt' as const }))
          : [];

      const transferItems: RecentActivityItem[] =
        transfer.status === 'fulfilled'
          ? transfer.value.data.map((d) => ({ ...d, moduleKey: 'transfer' as const }))
          : [];

      return [...receiptItems, ...transferItems]
        .sort((a, b) => {
          const da = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const db = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          return db - da;
        })
        .slice(0, 5);
    },
  });
}
