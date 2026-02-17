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

function BookCardSkeleton() {
  return (
    <div className="flex p-4 border rounded-xl gap-4 h-[220px] w-full bg-card shadow-sm">
      {/* Representação da Capa do Livro - Ajustada para h-full e w-[120px] */}
      <div className="relative h-full w-[120px] shrink-0">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>

      {/* Representação do Conteúdo lateral */}
      <div className="flex flex-col gap-2 flex-1 overflow-hidden">
        <div className="space-y-2">
          <Skeleton className="h-5 w-[90%]" /> {/* Título */}
          <Skeleton className="h-4 w-[70%]" /> {/* Autor */}
          <Skeleton className="h-3 w-16" /> {/* Páginas */}
        </div>

        <div className="mt-auto space-y-2.5">
          <Skeleton className="h-8 w-32 rounded-lg" /> {/* Botão de ação */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />{" "}
            {/* Badge Leitores */}
            <Skeleton className="h-5 w-20 rounded-full" /> {/* Badge Gênero */}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListGrid<T>({
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
    return <div className="text-gray-500 text-center mt-4">{emptyMessage}</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, index) => (
            <BookCardSkeleton key={index} />
          ))
        : items.map(renderItem)}
    </div>
  );
}
