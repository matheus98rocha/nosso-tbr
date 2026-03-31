import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import ClientBookshelves from "./index";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "shelf-1" }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("./_hooks/useBookshelfBooks", () => ({
  useBookshelfBooks: () => ({
    data: [],
    isLoading: false,
    isError: false,
    isSuccess: true,
    isFetched: true,
  }),
}));

vi.mock("./_hooks/useBookshelfMeta", () => ({
  useBookshelfMeta: vi.fn(() => ({
    data: { id: "shelf-1", name: "Coleção principal" },
    isLoading: false,
    isError: false,
  })),
}));

vi.mock("@/components", () => ({
  ListGrid: () => <div data-testid="list-grid" />,
  BookCard: () => null,
}));

describe("ClientBookshelves", () => {
  it("renders shelf name from useBookshelfMeta as subtitle", () => {
    render(<ClientBookshelves />);
    expect(screen.getByText("Livros na estante")).toBeInTheDocument();
    expect(screen.getByText("Coleção principal")).toBeInTheDocument();
  });
});
