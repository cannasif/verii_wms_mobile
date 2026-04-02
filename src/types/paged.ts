export type SortDirection = 'asc' | 'desc';
export type FilterLogic = 'and' | 'or';
export type FilterOperator = 'Contains' | 'Equals' | 'StartsWith' | 'EndsWith' | 'GreaterThan' | 'LessThan';

export interface PagedFilter {
  column: string;
  operator: FilterOperator;
  value: string;
}

export interface PagedParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  search?: string;
  filters?: PagedFilter[];
  filterLogic?: FilterLogic;
}

export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  exceptionMessage: string;
  data: T;
  errors: string[];
  timestamp: string;
  statusCode: number;
  className: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterColumnConfig {
  labelKey: string;
  value: string;
  type?: 'text' | 'number' | 'date';
  operators?: FilterOperator[];
}

export interface DraftFilterRow {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}
