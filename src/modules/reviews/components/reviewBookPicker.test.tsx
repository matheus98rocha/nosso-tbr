import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReviewBookOption } from "../types";
import ReviewBookPicker from "./reviewBookPicker";

const pickerState = vi.hoisted(() => ({
  books: [] as ReviewBookOption[],
  isLoading: false,
  isError: false,
}));

vi.mock("../hooks/useReviewBookOptions", () => ({
  useReviewBookOptions: () => pickerState,
}));

describe("ReviewBookPicker", () => {
  beforeEach(() => {
    pickerState.books = [
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
    pickerState.isLoading = false;
    pickerState.isError = false;
  });

  it("mostra o status do livro na linha e filtra pelo título", async () => {
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

  it("ordena por padrão: finalizados, em andamento e depois os outros", () => {
    pickerState.books = [
      {
        id: "planned-book",
        title: "Planejado",
        author: null,
        imageUrl: null,
        status: "planned",
        isSolo: false,
        hasReview: false,
      },
      {
        id: "reading-book",
        title: "Lendo",
        author: null,
        imageUrl: null,
        status: "reading",
        isSolo: false,
        hasReview: false,
      },
      {
        id: "paused-book",
        title: "Pausado",
        author: null,
        imageUrl: null,
        status: "paused",
        isSolo: false,
        hasReview: false,
      },
      {
        id: "finished-book",
        title: "Finalizado",
        author: null,
        imageUrl: null,
        status: "finished",
        isSolo: false,
        hasReview: false,
      },
      {
        id: "abandoned-book",
        title: "Abandonado",
        author: null,
        imageUrl: null,
        status: "abandoned",
        isSolo: false,
        hasReview: false,
      },
    ];

    render(<ReviewBookPicker onSelect={vi.fn()} />);

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      expect.stringContaining("Finalizado"),
      expect.stringContaining("Lendo"),
      expect.stringContaining("Planejado"),
      expect.stringContaining("Pausado"),
      expect.stringContaining("Abandonado"),
    ]);
  });
});