import { useCallback, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { FlatList } from 'react-native';
import { buildPagedRequest, getDefaultOperatorForColumn, rowsToBackendFilters } from '@/lib/paged';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type {
  DraftFilterRow,
  FilterColumnConfig,
  FilterLogic,
  PagedFilter,
  PagedParams,
  PagedResponse,
  SortDirection,
} from '@/types/paged';

interface UsePagedFlatListOptions<TItem> {
  queryKey: readonly unknown[];
  pageSize?: number;
  defaultSortBy?: string;
  defaultSortDirection?: SortDirection;
  columns?: readonly FilterColumnConfig[];
  defaultFilterColumn?: string;
  enabled?: boolean;
  fetchPage: (params: Required<PagedParams>, options?: ApiRequestOptions) => Promise<PagedResponse<TItem>>;
}

function createRow(defaultColumn: string, columns: readonly FilterColumnConfig[]): DraftFilterRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    column: defaultColumn,
    operator: getDefaultOperatorForColumn(defaultColumn, columns),
    value: '',
  };
}

export function usePagedFlatList<TItem>({
  queryKey,
  pageSize = 20,
  defaultSortBy = 'id',
  defaultSortDirection = 'desc',
  columns = [],
  defaultFilterColumn,
  enabled = true,
  fetchPage,
}: UsePagedFlatListOptions<TItem>) {
  const listRef = useRef<FlatList<TItem>>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [draftFilters, setDraftFilters] = useState<DraftFilterRow[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<PagedFilter[]>([]);
  const [filterLogic, setFilterLogic] = useState<FilterLogic>('and');

  const filterKey = useMemo(() => JSON.stringify(appliedFilters), [appliedFilters]);

  const query = useInfiniteQuery({
    queryKey: [...queryKey, pageSize, searchTerm, sortBy, sortDirection, filterLogic, filterKey],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchPage(
        buildPagedRequest({
          pageNumber: pageParam,
          pageSize,
          sortBy,
          sortDirection,
          search: searchTerm,
          filters: appliedFilters,
          filterLogic,
        }),
        { signal },
      ),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined),
  });

  const items = useMemo(() => query.data?.pages.flatMap((page) => page.data) ?? [], [query.data?.pages]);
  const latestPage = query.data?.pages.at(-1) ?? null;
  const totalCount = latestPage?.totalCount ?? 0;
  const hasActiveFilters = appliedFilters.length > 0 || searchTerm.length > 0;

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const submitSearch = useCallback(
    (value?: string) => {
      const nextValue = (value ?? searchInput).trim();
      setSearchTerm(nextValue);
      scrollToTop();
    },
    [scrollToTop, searchInput],
  );

  const refresh = useCallback(async () => {
    scrollToTop();
    await query.refetch();
  }, [query, scrollToTop]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  const reset = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
    setSortBy(defaultSortBy);
    setSortDirection(defaultSortDirection);
    setDraftFilters([]);
    setAppliedFilters([]);
    setFilterLogic('and');
    scrollToTop();
  }, [defaultSortBy, defaultSortDirection, scrollToTop]);

  const addDraftFilter = useCallback(() => {
    if (!defaultFilterColumn) return;
    setDraftFilters((prev) => [...prev, createRow(defaultFilterColumn, columns)]);
  }, [columns, defaultFilterColumn]);

  const updateDraftFilter = useCallback(
    (id: string, patch: Partial<Omit<DraftFilterRow, 'id'>>) => {
      setDraftFilters((prev) =>
        prev.map((row) => {
          if (row.id !== id) {
            return row;
          }

          const nextRow = { ...row, ...patch };
          if (patch.column) {
            nextRow.operator = getDefaultOperatorForColumn(patch.column, columns);
          }
          return nextRow;
        }),
      );
    },
    [columns],
  );

  const removeDraftFilter = useCallback((id: string) => {
    setDraftFilters((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(rowsToBackendFilters(draftFilters));
    scrollToTop();
  }, [draftFilters, scrollToTop]);

  return {
    listRef,
    items,
    totalCount,
    searchInput,
    setSearchInput,
    searchTerm,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    draftFilters,
    appliedFilters,
    filterLogic,
    setFilterLogic,
    hasActiveFilters,
    isInitialLoading: query.isLoading,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    hasNextPage: Boolean(query.hasNextPage),
    latestPage,
    submitSearch,
    refresh,
    loadMore,
    reset,
    scrollToTop,
    addDraftFilter,
    updateDraftFilter,
    removeDraftFilter,
    applyFilters,
  };
}
