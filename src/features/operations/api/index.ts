import i18n from '@/locales';
import { buildPagedRequest, createPagedResponse } from '@/lib/paged';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { FilterLogic, PagedFilter, PagedParams, PagedResponse } from '@/types/paged';
import type { OperationFeedItem, OperationStatus } from '../types';

const statuses: OperationStatus[] = ['Pending', 'InProgress', 'Completed', 'Critical'];
const zones = ['A-01', 'A-07', 'B-14', 'C-02', 'D-19', 'E-03'];
const assignees = ['Can Nasif', 'Ayşe K.', 'Mert A.', 'Zehra D.', 'Okan T.'];

function getSeedTitle(index: number): string {
  if (index % 3 === 0) {
    return i18n.t('screens.operations.task1Title');
  }

  if (index % 3 === 1) {
    return i18n.t('screens.operations.task2Title');
  }

  return i18n.t('screens.operations.task3Title');
}

const seedData: OperationFeedItem[] = Array.from({ length: 64 }, (_, index) => ({
  id: `op-${index + 1}`,
  documentNo: `WMS-${String(index + 1).padStart(5, '0')}`,
  title: getSeedTitle(index),
  status: statuses[index % statuses.length],
  zone: zones[index % zones.length],
  assignee: assignees[index % assignees.length],
  quantity: (index % 9) + 1,
  createdAt: new Date(Date.now() - index * 1000 * 60 * 45).toISOString(),
}));

function matchFilter(item: OperationFeedItem, filter: PagedFilter): boolean {
  const rawValue = item[filter.column as keyof OperationFeedItem];
  const itemValue = String(rawValue ?? '').toLowerCase();
  const filterValue = filter.value.toLowerCase();

  switch (filter.operator) {
    case 'Equals':
      return itemValue === filterValue;
    case 'StartsWith':
      return itemValue.startsWith(filterValue);
    case 'EndsWith':
      return itemValue.endsWith(filterValue);
    case 'GreaterThan':
      return Number(rawValue ?? 0) > Number(filter.value);
    case 'LessThan':
      return Number(rawValue ?? 0) < Number(filter.value);
    case 'Contains':
    default:
      return itemValue.includes(filterValue);
  }
}

function applyFilters(items: OperationFeedItem[], filters: PagedFilter[], logic: FilterLogic): OperationFeedItem[] {
  if (filters.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const results = filters.map((filter) => matchFilter(item, filter));
    return logic === 'or' ? results.some(Boolean) : results.every(Boolean);
  });
}

function applySearch(items: OperationFeedItem[], search: string): OperationFeedItem[] {
  if (!search.trim()) {
    return items;
  }

  const normalized = search.toLowerCase();
  return items.filter((item) =>
    [item.documentNo, item.title, item.status, item.zone, item.assignee].some((field) =>
      field.toLowerCase().includes(normalized),
    ),
  );
}

function applySort(items: OperationFeedItem[], sortBy: string, sortDirection: 'asc' | 'desc'): OperationFeedItem[] {
  const sorted = [...items].sort((left, right) => {
    const leftValue = left[sortBy as keyof OperationFeedItem];
    const rightValue = right[sortBy as keyof OperationFeedItem];

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return leftValue - rightValue;
    }

    return String(leftValue ?? '').localeCompare(String(rightValue ?? ''));
  });

  return sortDirection === 'asc' ? sorted : sorted.reverse();
}

export const operationsApi = {
  async getFeed(params: PagedParams = {}, options?: ApiRequestOptions): Promise<PagedResponse<OperationFeedItem>> {
    const request = buildPagedRequest(params, {
      pageSize: 10,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });

    const filtered = applySort(
      applyFilters(applySearch(seedData, request.search), request.filters, request.filterLogic),
      request.sortBy,
      request.sortDirection,
    );

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 240);
      options?.signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );
    });
    return createPagedResponse(filtered, request);
  },
};
