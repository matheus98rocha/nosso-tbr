import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEWS_COPY } from "../constants";
import { resetReviewComposerStore, useReviewComposerStore } from "../stores";
import type { ReviewFeedItem } from "../types";
import ReviewCard from "./reviewCard";

vi.mock("@/components/bookCover", () => ({
  BookCover: () => <div data-testid="cover" />,
}));

vi.mock("./reviewCommentsSheet", () => ({
  default: () => null,
}));

vi.mock("next/image", () => ({
  default: function MockImage() {
    return <div data-testid="image" />;
  },
}));

function review(patch: Partial<ReviewFeedItem> = {}): ReviewFeedItem {
  return {
    id: "review-1",
    userId: "author-1",
    authorDisplayName: "Ana",
    authorAvatarSeed: null,
    bookId: "book-1",
    bookTitle: "O Hobbit",
    bookImageUrl: null,
    bookAuthors: "Tolkien",
    bookIsSolo: true,
    stars: 5,
    content: "Uma viagem redonda.",
    readingStatus: "finished",
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    edited: false,
    likeCount: 0,
    dislikeCount: 0,
    commentCount: 0,
    userReaction: null,
    isOwn: true,
    ...patch,
  };
}

function renderCard(item: ReviewFeedItem) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ReviewCard review={item} onReact={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe("ReviewCard", () => {
  beforeAll(() => {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => undefined;
    Element.prototype.releasePointerCapture = () => undefined;
    Element.prototype.scrollIntoView = () => undefined;
  });

  beforeEach(() => {
    resetReviewComposerStore();
  });

  it("não oferece edição na resenha de outra pessoa", () => {
    renderCard(review({ isOwn: false, bookIsSolo: true }));

    expect(
      screen.queryByRole("button", { name: REVIEWS_COPY.menu }),
    ).not.toBeInTheDocument();
    expect(useReviewComposerStore.getState().open).toBe(false);
  });

  it("abre a edição com o aviso de livro privado quando a resenha é solo", async () => {
    const user = userEvent.setup();
    renderCard(review({ isOwn: true, bookIsSolo: true }));

    await user.click(screen.getByRole("button", { name: REVIEWS_COPY.menu }));
    await user.click(screen.getByRole("menuitem", { name: REVIEWS_COPY.edit }));

    expect(useReviewComposerStore.getState()).toMatchObject({
      open: true,
      mode: "compose",
      book: {
        id: "book-1",
        title: "O Hobbit",
        author: "Tolkien",
        isSolo: true,
        status: "finished",
      },
    });
  });

  it("abre a edição sem marcar livro privado quando a leitura é compartilhada", async () => {
    const user = userEvent.setup();
    const { unmount } = renderCard(review({ isOwn: true, bookIsSolo: false }));

    await user.click(screen.getByRole("button", { name: REVIEWS_COPY.menu }));
    await user.click(screen.getByRole("menuitem", { name: REVIEWS_COPY.edit }));

    expect(useReviewComposerStore.getState().book).toMatchObject({ isSolo: false });
    unmount();
  });
});
