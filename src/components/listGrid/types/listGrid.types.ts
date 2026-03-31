import type { ReactNode } from "react";

export type ListGridProps<T> = {
  items: T[];
  isLoading: boolean;
  isFetched: boolean;
  renderItem: (item: T) => ReactNode;
  emptyMessage?: string;
  skeletonCount?: number;
  skeletonClassName?: string;
  isError?: boolean;
};
