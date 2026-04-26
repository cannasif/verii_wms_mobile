import { useQuery } from '@tanstack/react-query';
import { workflowApi } from '@/features/operations/api/workflow-api';
import { useAuthStore } from '@/store/auth';

type HomeStats = {
  pendingReceipt: number;
  readyShipment: number;
  pendingTransfer: number;
};

export function useHomeStats() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery<HomeStats>({
    queryKey: ['home', 'stats', userId],
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
    queryFn: async ({ signal }) => {
      if (!userId) {
        return { pendingReceipt: 0, readyShipment: 0, pendingTransfer: 0 };
      }

      const [receipt, shipment, transfer] = await Promise.all([
        workflowApi.getAssignedHeaders('goods-receipt', userId, { pageNumber: 1, pageSize: 1 }, { signal }),
        workflowApi.getAssignedHeaders('shipment', userId, { pageNumber: 1, pageSize: 1 }, { signal }),
        workflowApi.getAssignedHeaders('transfer', userId, { pageNumber: 1, pageSize: 1 }, { signal }),
      ]);

      return {
        pendingReceipt: receipt.totalCount ?? 0,
        readyShipment: shipment.totalCount ?? 0,
        pendingTransfer: transfer.totalCount ?? 0,
      };
    },
  });
}
