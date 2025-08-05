import { Skeleton } from "@/components/ui/skeleton";
import ErrorComponent from "../error/error";

type ListGridProps<T> = {
  items: T[];
  isLoading: boolean;
  isFetched: boolean;
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
  skeletonCount?: number;
  skeletonClassName?: string;
  isError?: boolean;
};

export function ListGrid<T>({
  items,
  isLoading,
  isFetched,
  renderItem,
  emptyMessage = "Nenhum item encontrado.",
  skeletonCount = 8,
  skeletonClassName = "h-[192px] w-[327px] rounded-xl bg-primary opacity-40",
  isError = false,
}: ListGridProps<T>) {
  if (isError) {
    return <ErrorComponent />;
  }

  if (isFetched && items.length === 0) {
    return <div className="text-gray-500 text-center mt-4">{emptyMessage}</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, index) => (
            <Skeleton key={index} className={skeletonClassName} />
          ))
        : items.map(renderItem)}
    </div>
  );
}
