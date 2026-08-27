import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import BookshelfBooksSortableGrid from "./BookshelfBooksSortableGrid";
import type { BookDomain } from "@/types/books.types";

vi.mock("@/components/bookCard", () => ({
  BookCard: ({ book }: { book: BookDomain }) => <div>{book.title}</div>,
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  KeyboardSensor: class {},
  PointerSensor: class {},
  closestCenter: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  arrayMove: vi.fn(),
  rectSortingStrategy: {},
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: vi.fn(({ id }: { id: string }) => ({
    attributes: { "data-sortable-id": id },
    listeners: { onPointerDown: vi.fn() },
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: vi.fn(() => undefined) } },
}));

const BOOK: BookDomain = {
  id: "book-1",
  title: "Livro 1",
  author: "Autor",
  chosen_by: "u",
  pages: 1,
  readerIds: [],
  readersDisplay: "",
  gender: null,
  image_url: "/x.svg",
  user_id: "u",
};

describe("BookshelfBooksSortableGrid", () => {
  it("marks drag handle as disabled and not focusable when reorder is disabled", () => {
    render(
      <BookshelfBooksSortableGrid
        shelfId="s1"
        books={[BOOK]}
        isLoading={false}
        isFetched
        isError={false}
        emptyMessage="vazio"
        onReorder={vi.fn()}
        reorderDisabled
      />,
    );

    const handle = screen.getByRole("button", {
      name: 'Reordenação indisponível: Livro 1',
    });

    expect(handle).toHaveAttribute("aria-disabled", "true");
    expect(handle).toHaveAttribute("tabindex", "-1");
  });
});
