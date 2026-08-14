import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import BookCover from "./bookCover";

vi.mock("next/image", () => ({
  default: function MockImage({
    src,
    alt,
    onLoad,
    onError,
  }: {
    src: string;
    alt: string;
    onLoad?: () => void;
    onError?: () => void;
  }) {
    return (
      <img
        src={src}
        alt={alt}
        data-testid="book-cover-image"
        onLoad={onLoad}
        onError={onError}
      />
    );
  },
}));

describe("BookCover", () => {
  it("exibe skeleton enquanto a imagem carrega", () => {
    render(
      <BookCover
        src="https://m.media-amazon.com/images/I/81abc.jpg"
        alt="Capa do livro"
        width={90}
        height={130}
      />,
    );

    expect(screen.getByTestId("book-cover-image")).toHaveAttribute(
      "src",
      "https://m.media-amazon.com/images/I/81abc.jpg",
    );
    expect(document.querySelector("[data-slot='skeleton']")).toBeTruthy();
  });

  it("usa capa padrão para URL inválida", () => {
    render(
      <BookCover
        src="https://www.amazon.com.br/dp/B09X24N1H4"
        alt="Capa do livro"
        width={90}
        height={130}
      />,
    );

    expect(screen.getByTestId("book-cover-image")).toHaveAttribute(
      "src",
      BOOK_COVER_PLACEHOLDER_SRC,
    );
  });

  it("cai para capa padrão quando a imagem falha ao carregar", () => {
    render(
      <BookCover
        src="https://m.media-amazon.com/images/I/broken.jpg"
        alt="Capa do livro"
        width={90}
        height={130}
      />,
    );

    fireEvent.error(screen.getByTestId("book-cover-image"));

    expect(screen.getByTestId("book-cover-image")).toHaveAttribute(
      "src",
      BOOK_COVER_PLACEHOLDER_SRC,
    );
  });
});
