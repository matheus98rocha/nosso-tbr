import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ReadingNowBookItem } from "../readingNow.types";
import ReadingNowBookSlide from "./readingNowBookSlide";

vi.mock("@/components/bookCover", () => ({
  BookCover: () => <div data-testid="book-cover" />,
}));

const itemWithSchedule: ReadingNowBookItem = {
  book: {
    id: "book-1",
    title: "O Hobbit",
    author: "J.R.R. Tolkien",
    authorId: "author-1",
    chosen_by: "user-1",
    pages: 310,
    status: "reading",
    readerIds: ["user-1"],
    readersDisplay: "Matheus",
    start_date: "2026-08-01",
    gender: null,
    image_url: "https://example.com/cover.jpg",
    user_id: "user-1",
    is_reread: false,
    is_favorite: false,
  },
  scheduleProgress: {
    bookId: "book-1",
    total: 10,
    completed: 4,
    percentage: 40,
  },
  daysReading: 13,
};

const defaultProps = {
  onOpenDetails: vi.fn(),
  onNavigateToSchedule: vi.fn(),
  onNavigateToQuotes: vi.fn(),
  onFinishReading: vi.fn(),
  onPauseReading: vi.fn(),
  onAbandonReading: vi.fn(),
  isProgressLoading: false,
  isStatusPending: false,
};

describe("ReadingNowBookSlide", () => {
  it("keeps a single details trigger and groups schedule tools when the book has a cronograma", async () => {
    const user = userEvent.setup();
    const onOpenDetails = vi.fn();

    render(
      <ReadingNowBookSlide
        {...defaultProps}
        item={itemWithSchedule}
        onOpenDetails={onOpenDetails}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Ver detalhes: O Hobbit" }),
    ).toBeInTheDocument();
    expect(screen.getByText("13 dias lendo")).toBeInTheDocument();
    expect(screen.getByText("Cronograma: 4/10 dias")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cronograma" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Citações" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Criar cronograma" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Ver detalhes: O Hobbit" }),
    );
    expect(onOpenDetails).toHaveBeenCalledTimes(1);
  });

  it("shows the empty-schedule fallback instead of duplicating Cronograma", () => {
    render(
      <ReadingNowBookSlide
        {...defaultProps}
        item={{ ...itemWithSchedule, scheduleProgress: null }}
      />,
    );

    expect(screen.getByText("310 páginas · sem cronograma")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Criar cronograma" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cronograma" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Citações" })).toBeInTheDocument();
  });
});
