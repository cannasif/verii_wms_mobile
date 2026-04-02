import { usePagedFlatList } from '@/hooks/usePagedFlatList';
import { operationsApi } from '../api';
import { operationFilterColumns } from '../types';

export function useOperationFeed() {
  return usePagedFlatList({
    queryKey: ['operations', 'feed'],
    defaultSortBy: 'createdAt',
    defaultSortDirection: 'desc',
    defaultFilterColumn: 'documentNo',
    columns: operationFilterColumns,
    fetchPage: operationsApi.getFeed,
  });
}
