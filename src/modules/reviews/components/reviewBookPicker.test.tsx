import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReviewBookOption } from "../types";
import ReviewBookPicker from "./reviewBookPicker";

const { books, pickerState } = vi.hoisted(() => {
  const books: ReviewBookOption[] = [
    {
      id: "reading-book",
      title: "1984",
      author: "George Orwell",
      imageUrl: null,
      status: "reading",
      isSolo: false,
      hasReview: false,
    },
    {
      id: "finished-book",
      title: "O Hobbit",
      author: "Tolkien",
      imageUrl: null,
      status: "finished",
      isSolo: true,
      hasReview: true,
    },
  ];
  const pickerState = {
    books,
    isLoading: false,
    isError: false,
  };
  return { books, pickerState };
});

vi.mock("../hooks/useReviewBookOptions", () => ({
  useReviewBookOptions: () => pickerState,
}));

describe("ReviewBookPicker", () => {
  beforeEach(() => {
    pickerState.books = books;
    pickerState.isLoading = false;
    pickerState.isError = false;
  });

  it("mostra o status atual na linha e filtra pelo título", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<ReviewBookPicker onSelect={onSelect} />);

    expect(screen.getByText("Lendo agora")).toBeInTheDocument();
    expect(screen.getByText("Leitura finalizada")).toBeInTheDocument();
    expect(screen.getByText("Editar resenha")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Buscar nos seus livros"), "hobbit");
    expect(screen.queryByText("1984")).not.toBeInTheDocument();
    expect(screen.getByText("Leitura finalizada")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /O Hobbit/ }));
    expect(onSelect).toHaveBeenCalledWith({
      id: "finished-book",
      title: "O Hobbit",
      author: "Tolkien",
      imageUrl: null,
      status: "finished",
      isSolo: true,
    });
  });

  it("entrega o status da leitura em andamento para a trava de estrelas", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<ReviewBookPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /1984/ }));
    expect(onSelect).toHaveBeenCalledWith({
      id: "reading-book",
      title: "1984",
      author: "George Orwell",
      imageUrl: null,
      status: "reading",
      isSolo: false,
    });
  });

  it("não deixa escolher livro quando a busca não acha nada", async () => {
    const user = userEvent.setup();
    render(<ReviewBookPicker onSelect={vi.fn()} />);

    await user.type(screen.getByLabelText("Buscar nos seus livros"), "zzzz");
    expect(screen.getByText("Nenhum livro seu para resenhar.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /1984/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /O Hobbit/ })).not.toBeInTheDocument();
  });

  it("mostra a falha de carga sem fingir que não há livros", () => {
    pickerState.isError = true;
    pickerState.books = [];
    render(<ReviewBookPicker onSelect={vi.fn()} />);

    expect(screen.getByText("Não foi possível carregar as resenhas.")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum livro seu para resenhar.")).not.toBeInTheDocument();
  });
});