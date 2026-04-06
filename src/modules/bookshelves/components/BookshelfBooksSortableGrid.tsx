"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useCallback } from "react";
import { GripVertical, Library } from "lucide-react";
import { BookCard } from "@/components/bookCard";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorComponent from "@/components/error";
import type { BookDomain } from "@/types/books.types";
import { cn } from "@/lib/utils";

type BookshelfBooksSortableGridProps = {
  shelfId: string;
  books: BookDomain[];
  isLoading: boolean;
  isFetched: boolean;
  isError: boolean;
  emptyMessage: string;
  onReorder: (books: readonly BookDomain[], nextOrderedIds: string[]) => void;
  reorderDisabled?: boolean;
};

function BookCardSkeleton() {
  return (
    <div className="flex w-full overflow-hidden rounded-xl border border-border/60 bg-card">
      <div
        className="flex w-8 shrink-0 items-center justify-center border-r border-border/50 bg-muted/30 py-3"
        aria-hidden
      >
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <div className="flex min-w-0 flex-1 gap-2.5 p-2">
        <Skeleton className="h-[92px] w-14 shrink-0 rounded-md" />
        <div className="flex min-h-[92px] min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-3.5 w-[90%]" />
          <Skeleton className="h-3.5 w-[60%]" />
          <div className="mt-auto space-y-1.5">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableShelfBookItem({
  book,
  shelfId,
  reorderDisabled,
}: {
  book: BookDomain;
  shelfId: string;
  reorderDisabled: boolean;
}) {
  const id = book.id ?? "";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: reorderDisabled });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative min-w-0 rounded-xl",
        isDragging &&
          "z-20 shadow-md ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="flex overflow-hidden rounded-xl border border-border/60 bg-card transition-colors duration-200 hover:border-border">
        <button
          type="button"
          className={cn(
            "flex w-8 shrink-0 cursor-grab touch-none items-center justify-center border-r border-border/50 bg-muted/30 py-3 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            reorderDisabled && "pointer-events-none cursor-not-allowed opacity-40",
          )}
          aria-label={`Arrastar para reordenar: ${book.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 shrink-0" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <BookCard book={book} isShelf shelfId={shelfId} />
        </div>
      </div>
    </div>
  );
}

export default function BookshelfBooksSortableGrid({
  shelfId,
  books,
  isLoading,
  isFetched,
  isError,
  emptyMessage,
  onReorder,
  reorderDisabled = false,
}: BookshelfBooksSortableGridProps) {
  const itemIds = useMemo(
    () => books.map((b) => b.id).filter((id): id is string => Boolean(id)),
    [books],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const ids = [...itemIds];
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(ids, oldIndex, newIndex);
      onReorder(books, next);
    },
    [books, itemIds, onReorder],
  );

  if (isError) {
    return <ErrorComponent />;
  }

  if (isFetched && books.length === 0 && !isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border/70 bg-muted/15 px-5 py-10 text-center"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
          <Library className="h-5 w-5" aria-hidden />
        </div>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <BookCardSkeleton key={`shelf-skeleton-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div
          className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
          role="list"
          aria-label="Livros na estante, reordenáveis por arrastar"
        >
          {books.map((book) => (
            <div key={book.id} role="listitem" className="min-w-0">
              <SortableShelfBookItem
                book={book}
                shelfId={shelfId}
                reorderDisabled={reorderDisabled}
              />
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
