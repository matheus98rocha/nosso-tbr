import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const recapState = {
  filter: {
    period: { kind: "year" as const, year: 2026, month: 10, day: 7 },
    genders: [] as string[],
  },
  images: [] as { title: string; subtitle: string | null; coverSrcs: string[] }[],
  currentImage: null as null | {
    title: string;
    subtitle: string | null;
    coverSrcs: string[];
  },
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
  downloadCurrent: vi.fn(),
  downloadAll: vi.fn(),
};

vi.mock("../../hooks", () => ({
  useReadingRecap: () => recapState,
}));

import ReadingRecapModal from "./readingRecapModal";

describe("ReadingRecapModal", () => {
  beforeEach(() => {
    recapState.isEmpty = true;
    recapState.canDownload = false;
    recapState.isLoading = false;
    recapState.isShellPending = false;
    recapState.isGenderFilterEnabled = false;
    recapState.countLabel = null;
    recapState.images = [];
    recapState.currentImage = null;
    recapState.downloadCurrent.mockClear();
    recapState.downloadAll.mockClear();
    recapState.handleGenderFilterEnabledChange.mockClear();
  });

  it("mostra o skeleton do modal inteiro enquanto o recap não está pronto", () => {
    recapState.isShellPending = true;
    recapState.isLoading = true;
    render(<ReadingRecapModal isOpen onOpenChange={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Recap de leitura" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Carregando recap de leitura"),
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
      screen.getByRole("heading", { name: "Recap de leitura" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nenhuma leitura com capa cadastrada neste período. Troque o ano, o mês ou o dia.",
      ),
    ).toBeInTheDocument();
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

  it("permite baixar quando há imagens e oferece baixar todas se houver mais de uma", async () => {
    const user = userEvent.setup();
    recapState.isEmpty = false;
    recapState.canDownload = true;
    recapState.countLabel = "2 capas · 2 imagens";
    recapState.images = [
      {
        title: "Leituras do ano 2026 · 1/2",
        subtitle: null,
        coverSrcs: ["/a.jpg"],
      },
      {
        title: "Leituras do ano 2026 · 2/2",
        subtitle: null,
        coverSrcs: ["/b.jpg"],
      },
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
});
