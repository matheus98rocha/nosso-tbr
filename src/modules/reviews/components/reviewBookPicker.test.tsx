import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ReviewBookOption } from "../types";
import ReviewBookPicker from "./reviewBookPicker";

const { books } = vi.hoisted(() => {
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
  return { books };
});

vi.mock("../hooks/useReviewBookOptions", () => ({
  useReviewBookOptions: () => ({
    books,
    isLoading: false,
    isError: false,
  }),
}));

describe("ReviewBookPicker", () => {
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
});