import type { FilterColumnConfig } from '@/types/paged';

export interface TransferAssignedHeader {
  id: number;
  documentNo: string;
  documentDate: string;
  customerCode: string;
  customerName: string;
  sourceWarehouse: string;
  targetWarehouse: string;
  createdDate: string;
  isCompleted: boolean;
}

export const transferAssignedFilterColumns: readonly FilterColumnConfig[] = [
  { labelKey: 'paged.columns.documentNo', value: 'documentNo', type: 'text' },
  { labelKey: 'paged.columns.customerCode', value: 'customerCode', type: 'text', operators: ['Contains', 'Equals'] },
  { labelKey: 'paged.columns.customerName', value: 'customerName', type: 'text', operators: ['Contains', 'Equals'] },
  { labelKey: 'paged.columns.sourceWarehouse', value: 'sourceWarehouse', type: 'text', operators: ['Contains', 'Equals'] },
  { labelKey: 'paged.columns.targetWarehouse', value: 'targetWarehouse', type: 'text', operators: ['Contains', 'Equals'] },
];
