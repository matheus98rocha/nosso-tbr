import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientQuotes } from "./index";

vi.mock("./components", () => ({
  UpsertQuoteModal: () => null,
}));

vi.mock("./hooks/useQuotes", () => ({
  useQuotes: vi.fn(),
}));

import { useQuotes } from "./hooks/useQuotes";

const mockedUseQuotes = vi.mocked(useQuotes);

const baseHookReturn = {
  quotes: [],
  isLoading: false,
  isError: false,
  hasQuotes: false,
  deleteId: null,
  setDeleteId: vi.fn(),
  deleteMutation: { mutateAsync: vi.fn(), isPending: false },
  deleteOpen: false,
  handleOpenDelete: vi.fn(),
  setDeleteOpen: vi.fn(),
} as unknown as ReturnType<typeof useQuotes>;

describe("ClientQuotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseQuotes.mockReturnValue(baseHookReturn);
  });

  it("shows error state when quotes query fails", () => {
    mockedUseQuotes.mockReturnValue({
      ...baseHookReturn,
      isError: true,
    });

    render(<ClientQuotes id="book-1" title="Livro" />);

    expect(screen.getByText("Ops... Algo deu errado.")).toBeInTheDocument();
    expect(
      screen.queryByText("Você ainda não adicionou nenhuma citação."),
    ).not.toBeInTheDocument();
  });

  it("shows empty message only when query succeeds without quotes", () => {
    render(<ClientQuotes id="book-1" title="Livro" />);

    expect(
      screen.getByText("Você ainda não adicionou nenhuma citação."),
    ).toBeInTheDocument();
  });
});
