import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorComponent from "../error";
import type { ListGridProps } from "./types/listGrid.types";

function BookCardSkeleton() {
  return (
    <div className="flex p-4 border rounded-xl gap-4 h-[220px] w-full bg-card shadow-sm">
      <div className="relative h-full w-[120px] shrink-0">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-hidden">
        <div className="space-y-2">
          <Skeleton className="h-5 w-[90%]" />
          <Skeleton className="h-4 w-[70%]" />
          <Skeleton className="h-3 w-16" />
        </div>

        <div className="mt-auto space-y-2.5">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ListGridComponent<T>({
  items,
  isLoading,
  isFetched,
  renderItem,
  emptyMessage = "Nenhum item encontrado.",
  skeletonCount = 8,
  isError = false,
}: ListGridProps<T>) {
  if (isError) {
    return <ErrorComponent />;
  }

  if (isFetched && items.length === 0 && !isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="text-gray-500 text-center mt-4"
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
      {isLoading
        ? Array.from({ length: skeletonCount }, (_, index) => (
            <BookCardSkeleton key={`list-grid-skeleton-${index}`} />
          ))
        : items.map(renderItem)}
    </div>
  );
}

export const ListGrid = memo(ListGridComponent) as typeof ListGridComponent;
