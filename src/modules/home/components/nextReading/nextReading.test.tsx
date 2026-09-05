import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import NextReading from "./nextReading";
import type { NextReadingItem } from "./nextReading.types";

vi.mock("@/components/bookCover", () => ({
  BookCover: () => <div data-testid="book-cover" />,
}));

vi.mock("@/components/bookCard/components/bookOptionsMenu", () => ({
  default: () => null,
}));

vi.mock("./components/nextReadingBookDetailsModal", () => ({
  default: () => null,
}));

const mockOpenBookDetails = vi.fn();
const mockNavigateToSchedule = vi.fn();
const mockRequestStartReading = vi.fn();
const mockCancelStartReading = vi.fn();
const mockConfirmStartReading = vi.fn();

const sampleItem: NextReadingItem = {
  book: {
    id: "book-1",
    title: "Duna",
    author: "Frank Herbert",
    authorId: "author-1",
    chosen_by: "user-1",
    pages: 688,
    status: "planned",
    readerIds: ["user-1"],
    readersDisplay: "Matheus",
    start_date: null,
    planned_start_date: "2026-09-10",
    end_date: null,
    gender: null,
    image_url: "https://example.com/cover.jpg",
    user_id: "user-1",
    is_reread: false,
    is_favorite: false,
  },
  dateMeta: {
    daysUntilStart: 5,
    isStartOverdue: false,
    isToday: false,
    relativeLabel: "Em 5 dias",
    formattedStartDate: "10 de set",
  },
};

vi.mock("./hooks", () => ({
  useNextReading: vi.fn(),
}));

import { useNextReading } from "./hooks";

const mockedUseNextReading = vi.mocked(useNextReading);

const baseHookReturn = {
  item: null as NextReadingItem | null,
  shouldRender: false,
  isLoading: false,
  isFetched: true,
  isError: false,
  detailsBook: null,
  detailsModalOpen: false,
  openBookDetails: mockOpenBookDetails,
  handleDetailsOpenChange: vi.fn(),
  pendingStartBook: null,
  requestStartReading: mockRequestStartReading,
  cancelStartReading: mockCancelStartReading,
  confirmStartReading: mockConfirmStartReading,
  navigateToSchedule: mockNavigateToSchedule,
  isStatusPending: false,
  transitioningBookId: null,
};

describe("NextReading", () => {
  it("não renderiza quando shouldRender é false", () => {
    mockedUseNextReading.mockReturnValue({ ...baseHookReturn });

    const { container } = render(<NextReading />);

    expect(container).toBeEmptyDOMElement();
  });

  it("mostra skeleton com aria-busy no loading", () => {
    mockedUseNextReading.mockReturnValue({
      ...baseHookReturn,
      shouldRender: true,
      isLoading: true,
    });

    render(<NextReading />);

    expect(screen.getByLabelText("Próxima leitura")).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it("exibe livro, data e CTA iniciar leitura", async () => {
    const user = userEvent.setup();
    mockedUseNextReading.mockReturnValue({
      ...baseHookReturn,
      shouldRender: true,
      item: sampleItem,
    });

    render(<NextReading />);

    expect(screen.getByText("Duna")).toBeInTheDocument();
    expect(screen.getByText("Frank Herbert")).toBeInTheDocument();
    expect(screen.getByText(/Início: 10 de set/i)).toBeInTheDocument();
    expect(screen.getByText("Em 5 dias")).toBeInTheDocument();
    expect(screen.getByText("688 páginas")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Iniciar leitura de Duna" }),
    );
    expect(mockRequestStartReading).toHaveBeenCalledWith(sampleItem.book);
  });

  it("mostra erro suave quando a query falha", () => {
    mockedUseNextReading.mockReturnValue({
      ...baseHookReturn,
      shouldRender: true,
      isError: true,
    });

    render(<NextReading />);

    expect(
      screen.getByText("Não foi possível carregar sua próxima leitura."),
    ).toBeInTheDocument();
  });
});
