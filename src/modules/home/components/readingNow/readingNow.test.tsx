import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ReadingNow from "./readingNow";
import type { ReadingNowBookItem } from "./readingNow.types";

vi.mock("@/components/bookCover", () => ({
  BookCover: () => <div data-testid="book-cover" />,
}));

vi.mock("./components/readingNowBookDetailsModal", () => ({
  default: () => null,
}));

vi.mock("@/modules/bookRating/components/finishedReadingRatingDialog", () => ({
  default: () => null,
}));

const mockGoToIndex = vi.fn();
const mockGoToNext = vi.fn();
const mockGoToPrevious = vi.fn();
const mockNavigateToSchedule = vi.fn();
const mockNavigateToQuotes = vi.fn();
const mockOpenBookDetails = vi.fn();
const mockFinishReading = vi.fn();
const mockPauseReading = vi.fn();
const mockAbandonReading = vi.fn();
const mockRequestStatusTransition = vi.fn();
const mockCancelStatusTransition = vi.fn();
const mockConfirmStatusTransition = vi.fn();

const sampleItem: ReadingNowBookItem = {
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

vi.mock("./hooks", () => ({
  useReadingNow: vi.fn(),
}));

import { useReadingNow } from "./hooks";

const mockedUseReadingNow = vi.mocked(useReadingNow);

const baseHookReturn = {
  scrollRef: { current: null },
  items: [] as ReadingNowBookItem[],
  activeIndex: 0,
  activeItem: null,
  activeBookTitle: null,
  hasMultipleBooks: false,
  shouldRender: false,
  isLoading: false,
  isFetched: true,
  isError: false,
  isProgressLoading: false,
  isProgressError: false,
  goToIndex: mockGoToIndex,
  goToNext: mockGoToNext,
  goToPrevious: mockGoToPrevious,
  handleScroll: vi.fn(),
  navigateToSchedule: mockNavigateToSchedule,
  navigateToQuotes: mockNavigateToQuotes,
  activeScheduleHref: null,
  canGoPrevious: false,
  canGoNext: false,
  detailsBook: null,
  detailsModalOpen: false,
  openBookDetails: mockOpenBookDetails,
  handleDetailsOpenChange: vi.fn(),
  finishReading: mockFinishReading,
  pauseReading: mockPauseReading,
  abandonReading: mockAbandonReading,
  pendingStatusTransition: null,
  requestStatusTransition: mockRequestStatusTransition,
  cancelStatusTransition: mockCancelStatusTransition,
  confirmStatusTransition: mockConfirmStatusTransition,
  isStatusPending: false,
  transitioningBookId: null,
  ratingPromptBookId: null,
  dismissRatingPrompt: vi.fn(),
} as unknown as ReturnType<typeof useReadingNow>;

describe("ReadingNow", () => {
  it("does not render when there are no reading books", () => {
    mockedUseReadingNow.mockReturnValue({
      ...baseHookReturn,
      shouldRender: false,
    });

    const { container } = render(<ReadingNow />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a single reading book with progress, details trigger and status actions", async () => {
    mockedUseReadingNow.mockReturnValue({
      ...baseHookReturn,
      items: [sampleItem],
      activeItem: sampleItem,
      shouldRender: true,
      activeScheduleHref: "/schedule/book-1/O Hobbit",
    });

    const user = userEvent.setup();

    render(<ReadingNow />);

    expect(screen.getByLabelText("Lendo agora")).toBeInTheDocument();
    expect(screen.getByText("O Hobbit")).toBeInTheDocument();
    expect(screen.getByText("J.R.R. Tolkien")).toBeInTheDocument();
    expect(screen.getByText("Cronograma: 4/10 dias")).toBeInTheDocument();
    expect(screen.getByText("13 dias lendo")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Registrar progresso" }),
    ).toHaveAttribute("href", "/schedule/book-1/O Hobbit");

    await user.click(screen.getByRole("button", { name: "Ver detalhes: O Hobbit" }));
    expect(mockOpenBookDetails).toHaveBeenCalledWith(sampleItem.book);

    await user.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(mockRequestStatusTransition).toHaveBeenCalledWith(sampleItem.book, "finished");

    await user.click(screen.getByRole("button", { name: "Pausar" }));
    expect(mockRequestStatusTransition).toHaveBeenCalledWith(sampleItem.book, "paused");

    await user.click(screen.getByRole("button", { name: "Abandonar" }));
    expect(mockRequestStatusTransition).toHaveBeenCalledWith(sampleItem.book, "abandoned");
  });

  it("shows confirmation dialog when a status transition is pending", async () => {
    mockedUseReadingNow.mockReturnValue({
      ...baseHookReturn,
      items: [sampleItem],
      activeItem: sampleItem,
      shouldRender: true,
      pendingStatusTransition: {
        book: sampleItem.book,
        nextStatus: "finished",
      },
    });

    render(<ReadingNow />);

    expect(screen.getByText("Finalizar leitura?")).toBeInTheDocument();
    expect(
      screen.getByText(/Você está prestes a marcar “O Hobbit” como lido/),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Finalizar leitura" }));
    expect(mockConfirmStatusTransition).toHaveBeenCalled();
  });

  it("shows pause confirmation dialog with correct content", () => {
    mockedUseReadingNow.mockReturnValue({
      ...baseHookReturn,
      items: [sampleItem],
      activeItem: sampleItem,
      shouldRender: true,
      pendingStatusTransition: {
        book: sampleItem.book,
        nextStatus: "paused",
      },
    });

    render(<ReadingNow />);

    expect(screen.getByText("Pausar leitura?")).toBeInTheDocument();
    expect(
      screen.getByText(/Você está prestes a pausar “O Hobbit”/),
    ).toBeInTheDocument();
  });

  it("shows abandon confirmation dialog with correct content", async () => {
    mockedUseReadingNow.mockReturnValue({
      ...baseHookReturn,
      items: [sampleItem],
      activeItem: sampleItem,
      shouldRender: true,
      pendingStatusTransition: {
        book: sampleItem.book,
        nextStatus: "abandoned",
      },
    });

    const user = userEvent.setup();

    render(<ReadingNow />);

    expect(screen.getByText("Abandonar leitura?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abandonar leitura" }));
    expect(mockConfirmStatusTransition).toHaveBeenCalled();
  });

  it("shows carousel controls when multiple books are reading", async () => {
    const secondItem: ReadingNowBookItem = {
      ...sampleItem,
      book: {
        ...sampleItem.book,
        id: "book-2",
        title: "1984",
        author: "George Orwell",
      },
      scheduleProgress: null,
      daysReading: 2,
    };

    mockedUseReadingNow.mockReturnValue({
      ...baseHookReturn,
      items: [sampleItem, secondItem],
      activeItem: sampleItem,
      activeBookTitle: "O Hobbit",
      hasMultipleBooks: true,
      shouldRender: true,
      activeScheduleHref: "/schedule/book-1/O Hobbit",
      canGoNext: true,
    });

    const user = userEvent.setup();

    render(<ReadingNow />);

    expect(screen.getAllByText("O Hobbit").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByLabelText("Livro 1 de 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Livro 2 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próximo livro" }));
    expect(mockGoToNext).toHaveBeenCalled();
  });

  it("shows error message when loading fails", () => {
    mockedUseReadingNow.mockReturnValue({
      ...baseHookReturn,
      shouldRender: true,
      isError: true,
    });

    render(<ReadingNow />);

    expect(
      screen.getByText("Não foi possível carregar seus livros em leitura."),
    ).toBeInTheDocument();
  });

  it("shows create schedule CTA when book has no schedule", () => {
    mockedUseReadingNow.mockReturnValue({
      ...baseHookReturn,
      items: [{ ...sampleItem, scheduleProgress: null }],
      activeItem: { ...sampleItem, scheduleProgress: null },
      shouldRender: true,
    });

    render(<ReadingNow />);

    expect(
      screen.getByRole("button", { name: "Criar cronograma" }),
    ).toBeInTheDocument();
  });
});
