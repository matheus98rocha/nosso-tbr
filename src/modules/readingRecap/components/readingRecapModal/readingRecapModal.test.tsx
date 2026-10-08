import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RecapImage } from "../../types";

const recapState = {
  filter: {
    period: { kind: "year" as const, year: 2026, month: 10, day: 7 },
    genders: [] as string[],
  },
  images: [] as RecapImage[],
  currentImage: null as RecapImage | null,
  imageIndex: 0,
  isEmpty: true,
  canDownload: false,
  isDownloading: false,
  isLoading: false,
  isProbing: false,
  isShellPending: false,
  isGenderFilterEnabled: false,
  isError: false,
  periodTitle: "Leituras do ano 2026",
  countLabel: null as string | null,
  emptyCaption: undefined as string | undefined,
  anchorDate: new Date(2026, 9, 7, 12),
  yearOptions: [2026],
  monthOptions: [{ value: "10", label: "outubro" }],
  handlePeriodKindChange: vi.fn(),
  handleAnchorDateChange: vi.fn(),
  handleMonthChange: vi.fn(),
  handleYearChange: vi.fn(),
  handleToggleGender: vi.fn(),
  handleGenderFilterEnabledChange: vi.fn(),
  handlePreviousImage: vi.fn(),
  handleNextImage: vi.fn(),
  handleSelectImage: vi.fn(),
  handleRemoveBook: vi.fn(),
  downloadCurrent: vi.fn(),
  downloadAll: vi.fn(),
};

vi.mock("../../hooks", () => ({
  useReadingRecap: () => recapState,
}));

import ReadingRecapModal from "./readingRecapModal";

function recapImage(title: string, bookId: string, src: string): RecapImage {
  const covers = [{ bookId, title: bookId, src }];
  return {
    title,
    subtitle: null,
    covers,
    coverSrcs: covers.map((cover) => cover.src),
  };
}

describe("ReadingRecapModal", () => {
  beforeEach(() => {
    recapState.isEmpty = true;
    recapState.canDownload = false;
    recapState.isLoading = false;
    recapState.isShellPending = false;
    recapState.isGenderFilterEnabled = false;
    recapState.countLabel = null;
    recapState.emptyCaption = undefined;
    recapState.images = [];
    recapState.currentImage = null;
    recapState.downloadCurrent.mockClear();
    recapState.downloadAll.mockClear();
    recapState.handleGenderFilterEnabledChange.mockClear();
    recapState.handleRemoveBook.mockClear();
  });

  it("mostra o skeleton do modal inteiro enquanto o recap não está pronto", () => {
    recapState.isShellPending = true;
    recapState.isLoading = true;
    render(<ReadingRecapModal isOpen onOpenChange={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Compartilhar leituras" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Carregando imagens das leituras"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ano" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Baixar" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Filtrar por gênero" }),
    ).not.toBeInTheDocument();
  });

  it("mostra estado vazio, esconde gênero e desabilita o download", () => {
    render(<ReadingRecapModal isOpen onOpenChange={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Compartilhar leituras" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nenhuma leitura finalizada neste período. Troque o ano, o mês ou o dia.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Nenhuma leitura com capa cadastrada neste período. Troque o ano, o mês ou o dia.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ano" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByRole("button", { name: "Romance" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Baixar" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Baixar todas" }),
    ).not.toBeInTheDocument();
  });

  it("mostra a copy de exclusão manual quando o hook esvazia o recap", () => {
    recapState.emptyCaption =
      "Você removeu todas as capas. Feche e abra de novo para restaurá-las.";
    render(<ReadingRecapModal isOpen onOpenChange={vi.fn()} />);

    expect(
      screen.getByText(
        "Você removeu todas as capas. Feche e abra de novo para restaurá-las.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Nenhuma leitura finalizada neste período. Troque o ano, o mês ou o dia.",
      ),
    ).not.toBeInTheDocument();
  });

  it("permite baixar quando há imagens e oferece baixar todas se houver mais de uma", async () => {
    const user = userEvent.setup();
    recapState.isEmpty = false;
    recapState.canDownload = true;
    recapState.countLabel = "2 capas · 2 imagens";
    recapState.images = [
      recapImage("Leituras do ano 2026 · 1/2", "book-a", "/a.jpg"),
      recapImage("Leituras do ano 2026 · 2/2", "book-b", "/b.jpg"),
    ];
    recapState.currentImage = recapState.images[0];

    render(<ReadingRecapModal isOpen onOpenChange={vi.fn()} />);

    expect(screen.getByText("2 capas · 2 imagens")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Baixar" }));
    await user.click(screen.getByRole("button", { name: "Baixar todas" }));

    expect(recapState.downloadCurrent).toHaveBeenCalledOnce();
    expect(recapState.downloadAll).toHaveBeenCalledOnce();
    expect(screen.queryByText("1/2", { exact: true })).not.toBeInTheDocument();
  });

  it("repasse handleRemoveBook para o preview", async () => {
    const user = userEvent.setup();
    recapState.isEmpty = false;
    recapState.canDownload = true;
    recapState.images = [
      {
        title: "Leituras do ano 2026",
        subtitle: null,
        covers: [{ bookId: "book-duna", title: "Duna", src: "/a.jpg" }],
        coverSrcs: ["/a.jpg"],
      },
    ];
    recapState.currentImage = recapState.images[0];

    render(<ReadingRecapModal isOpen onOpenChange={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Remover Duna do recap" }),
    );
    expect(recapState.handleRemoveBook).toHaveBeenCalledWith("book-duna");
  });
});
