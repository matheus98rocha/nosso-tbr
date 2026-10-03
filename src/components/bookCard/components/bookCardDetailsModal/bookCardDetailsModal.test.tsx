import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import type { BookDomain } from "@/types/books.types";

import BookCardDetailsModal from "./bookCardDetailsModal";

vi.mock("next/image", () => ({
  default: function MockImage({ alt }: { alt: string }) {
    return <img alt={alt} />;
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/modules/bookRating", () => ({
  CardReadingRatingButton: () => <div>Avaliar leitura</div>,
}));

vi.mock("@/modules/schedule/components/readingProgressIndicator", () => ({
  CardReadingProgressIndicator: () => <div>Progresso do cronograma</div>,
}));

const book: BookDomain = {
  id: "book-1",
  title: "A Fúria dos Reis",
  author: "George R. R. Martin",
  chosen_by: "user-1",
  pages: 656,
  readerIds: ["user-1"],
  readersDisplay: "Matheus",
  status: "planned",
  planned_start_date: null,
  start_date: null,
  end_date: null,
  gender: "fantasy",
  image_url: "/cover.jpg",
  user_id: "user-1",
  is_reread: false,
  is_favorite: false,
  reading_rating_stars: null,
};

function renderModal(
  override: Partial<ComponentProps<typeof BookCardDetailsModal>> = {},
) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    book,
    statusDisplay: {
      label: "Vou ler",
      colorClass: "bg-blue-100 text-blue-700",
      dotClass: "bg-blue-500",
    },
    isLogged: true,
    isOwnSoloBook: true,
    canAccessCollectiveReading: false,
    scheduleDisabled: false,
    quotesDisabled: false,
    onAuthorSearch: vi.fn(),
    onCollectiveReading: vi.fn(),
    onOpenSchedule: vi.fn(),
    onOpenQuotes: vi.fn(),
    onStartReading: vi.fn(),
    onShare: vi.fn(),
    onAddToShelf: vi.fn(),
    onEdit: vi.fn(),
    showLibraryActions: true,
    ...override,
  };

  render(<BookCardDetailsModal {...props} />);
  return props;
}

describe("BookCardDetailsModal", () => {
  it("mostra a ficha com previsão, leitores e ações de biblioteca", () => {
    renderModal();

    expect(
      screen.getByRole("heading", { name: "A Fúria dos Reis" }),
    ).toBeInTheDocument();
    expect(screen.getByText("George R. R. Martin")).toBeInTheDocument();
    expect(screen.getByText("Vou ler")).toBeInTheDocument();
    expect(screen.getByText("Privado")).toBeInTheDocument();
    expect(screen.getByText("656")).toBeInTheDocument();
    expect(screen.getByText("22 dias")).toBeInTheDocument();
    expect(screen.getByText("30 pág./dia")).toBeInTheDocument();
    expect(screen.getByText("Matheus")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Iniciar leitura" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Copiar referência/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Compartilhar/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Editar livro/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Adicionar à estante/ }),
    ).toBeInTheDocument();
  });

  it("pede a exclusão do livro sem apagar na hora", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderModal({ onDelete });

    await user.click(screen.getByRole("button", { name: /Deletar livro/ }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("copia a referência bibliográfica", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderModal();

    await user.click(screen.getByRole("button", { name: /Copiar referência/ }));

    expect(writeText).toHaveBeenCalledWith(
      "A Fúria dos Reis — George R. R. Martin · 656 pág.",
    );
  });

  it("pede confirmação antes de abandonar uma leitura em andamento", async () => {
    const user = userEvent.setup();
    const onAbandonReading = vi.fn();
    renderModal({
      book: { ...book, status: "reading", start_date: "2026-10-01" },
      statusDisplay: {
        label: "Lendo agora",
        colorClass: "bg-amber-100 text-amber-700",
        dotClass: "bg-amber-500",
      },
      showScheduleProgress: true,
      onFinishReading: vi.fn(),
      onPauseReading: vi.fn(),
      onAbandonReading,
    });

    expect(screen.getByText("Progresso do cronograma")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Abandonar leitura/ }));

    const confirmDialog = screen.getByRole("dialog", {
      name: "Abandonar leitura?",
    });
    await user.click(
      within(confirmDialog).getByRole("button", { name: "Abandonar leitura" }),
    );

    expect(onAbandonReading).toHaveBeenCalledTimes(1);
  });

  it("bloqueia o cronograma de um livro finalizado e oferece a avaliação", () => {
    renderModal({
      book: {
        ...book,
        status: "finished",
        start_date: "2026-09-01",
        end_date: "2026-09-20",
        reading_rating_stars: 4,
      },
      statusDisplay: {
        label: "Leitura finalizada",
        colorClass: "bg-emerald-100 text-emerald-700",
        dotClass: "bg-emerald-500",
      },
      scheduleDisabled: true,
      quotesDisabled: false,
    });

    expect(screen.getByRole("button", { name: /Cronograma/ })).toBeDisabled();
    expect(screen.getByText("Avaliar leitura")).toBeInTheDocument();
    expect(screen.getByLabelText("Nota 4 de 5")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Iniciar leitura" }),
    ).not.toBeInTheDocument();
  });
});
