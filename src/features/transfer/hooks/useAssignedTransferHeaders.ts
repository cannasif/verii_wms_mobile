import { useAuthStore } from '@/store/auth';
import { usePagedFlatList } from '@/hooks/usePagedFlatList';
import { transferApi } from '../api';
import { transferAssignedFilterColumns } from '../types';

export function useAssignedTransferHeaders() {
  const userId = useAuthStore((state) => state.user?.id);

  return usePagedFlatList({
    queryKey: ['transfer', 'assigned', userId ?? 0],
    enabled: Boolean(userId),
    defaultSortBy: 'Id',
    defaultSortDirection: 'desc',
    defaultFilterColumn: 'documentNo',
    columns: transferAssignedFilterColumns,
    fetchPage: (params) => transferApi.getAssignedHeaders(userId ?? 0, params),
  });
}
