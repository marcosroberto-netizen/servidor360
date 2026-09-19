import type { ReactNode } from "react";

export type DataTableSortDirection = "asc" | "desc";

export interface DataTableColumn<TItem, TKey extends string = string> {
  key: TKey;
  label: string;
  className?: string;
  getValue: (item: TItem) => string;
  render?: (item: TItem) => ReactNode;
  filterable?: boolean;
  sortable?: boolean;
}

export type DataTableColumnFilters<TKey extends string = string> = Partial<
  Record<TKey, string[]>
>;

export interface DataTableProps<TItem, TKey extends string = string> {
  columns: DataTableColumn<TItem, TKey>[];
  defaultSortKey: TKey;
  emptyMessage?: string;
  errorMessage?: string;
  exportFileName?: string;
  getRowId: (item: TItem) => string;
  isError: boolean;
  isLoading: boolean;
  items: TItem[];
  pageSizeOptions?: number[];
  renderRowAction?: (item: TItem) => ReactNode;
  searchPlaceholder?: string;
  urlStateKeyPrefix?: string;
}
