import type {
  DraftFilterRow,
  FilterColumnConfig,
  FilterOperator,
  PagedFilter,
  PagedParams,
  PagedResponse,
} from '@/types/paged';

export interface BuildPagedRequestDefaults {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  filters?: PagedFilter[];
  filterLogic?: 'and' | 'or';
}

export function buildPagedRequest(
  params: PagedParams = {},
  defaults: BuildPagedRequestDefaults = {},
): Required<PagedParams> {
  return {
    pageNumber: params.pageNumber ?? defaults.pageNumber ?? 1,
    pageSize: params.pageSize ?? defaults.pageSize ?? 20,
    sortBy: params.sortBy ?? defaults.sortBy ?? 'id',
    sortDirection: params.sortDirection ?? defaults.sortDirection ?? 'desc',
    search: params.search ?? defaults.search ?? '',
    filters: params.filters ?? defaults.filters ?? [],
    filterLogic: params.filterLogic ?? defaults.filterLogic ?? 'and',
  };
}

export function createPagedResponse<T>(items: T[], params: Required<PagedParams>): PagedResponse<T> {
  const totalCount = items.length;
  const totalPages = Math.max(Math.ceil(totalCount / params.pageSize), 1);
  const normalizedPageNumber = params.pageNumber < 1 ? 1 : params.pageNumber;
  const start = (normalizedPageNumber - 1) * params.pageSize;
  const end = start + params.pageSize;

  return {
    data: items.slice(start, end),
    totalCount,
    pageNumber: normalizedPageNumber,
    pageSize: params.pageSize,
    totalPages,
    hasPreviousPage: normalizedPageNumber > 1,
    hasNextPage: end < totalCount,
  };
}

export function rowsToBackendFilters(rows: DraftFilterRow[]): PagedFilter[] {
  return rows
    .filter((row) => row.value.trim().length > 0)
    .map((row) => ({
      column: row.column,
      operator: row.operator,
      value: row.value.trim(),
    }));
}

export function getDefaultOperatorForColumn(
  column: string,
  columns: readonly FilterColumnConfig[],
): FilterOperator {
  const config = columns.find((item) => item.value === column);
  return config?.operators?.[0] ?? (config?.type === 'number' ? 'Equals' : 'Contains');
}

export function getOperatorsForColumn(
  column: string,
  columns: readonly FilterColumnConfig[],
): FilterOperator[] {
  const config = columns.find((item) => item.value === column);
  if (config?.operators?.length) {
    return config.operators;
  }

  if (config?.type === 'number') {
    return ['Equals', 'GreaterThan', 'LessThan'];
  }

  return ['Contains', 'Equals', 'StartsWith', 'EndsWith'];
}

export function getPagedSummary<T>(
  response?: PagedResponse<T> | null,
): { from: number; to: number; total: number } {
  if (!response || response.totalCount === 0) {
    return { from: 0, to: 0, total: 0 };
  }

  const from = response.pageNumber * response.pageSize + 1;
  const fromNormalized = (response.pageNumber - 1) * response.pageSize + 1;
  const to = Math.min(response.pageNumber * response.pageSize, response.totalCount);

  return { from: fromNormalized, to, total: response.totalCount };
}
