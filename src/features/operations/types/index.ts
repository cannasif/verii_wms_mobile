import type { FilterColumnConfig } from '@/types/paged';

export type OperationStatus = 'Pending' | 'InProgress' | 'Completed' | 'Critical';

export interface OperationFeedItem {
  id: string;
  documentNo: string;
  title: string;
  status: OperationStatus;
  zone: string;
  assignee: string;
  quantity: number;
  createdAt: string;
}

export const operationFilterColumns: readonly FilterColumnConfig[] = [
  { labelKey: 'paged.columns.documentNo', value: 'documentNo', type: 'text' },
  { labelKey: 'paged.columns.status', value: 'status', type: 'text', operators: ['Contains', 'Equals'] },
  { labelKey: 'paged.columns.zone', value: 'zone', type: 'text', operators: ['Contains', 'Equals'] },
  { labelKey: 'paged.columns.assignee', value: 'assignee', type: 'text', operators: ['Contains', 'Equals'] },
  { labelKey: 'paged.columns.quantity', value: 'quantity', type: 'number', operators: ['Equals', 'GreaterThan', 'LessThan'] },
];
