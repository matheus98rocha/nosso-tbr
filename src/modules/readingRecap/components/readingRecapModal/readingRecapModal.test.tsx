import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const recapState = {
  filter: {
    period: { kind: "day" as const, year: 2026, month: 10, day: 7 },
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
  isError: false,
  periodTitle: "Leituras de 7 de outubro de 2026",
  anchorDate: new Date(2026, 9, 7, 12),
  yearOptions: [2026],
  monthOptions: [{ value: "10", label: "outubro" }],
  handlePeriodKindChange: vi.fn(),
  handleAnchorDateChange: vi.fn(),
  handleMonthChange: vi.fn(),
  handleYearChange: vi.fn(),
  handleToggleGender: vi.fn(),
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
    recapState.images = [];
    recapState.currentImage = null;
    recapState.downloadCurrent.mockClear();
    recapState.downloadAll.mockClear();
  });

  it("mostra estado vazio e desabilita o download", () => {
    render(<ReadingRecapModal isOpen onOpenChange={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Recap de leitura" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nenhuma leitura com capa cadastrada neste período. Tente outro dia, mês ou ano.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Baixar" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Baixar todas" }),
    ).not.toBeInTheDocument();
  });

  it("permite baixar quando há imagens e oferece baixar todas se houver mais de uma", async () => {
    const user = userEvent.setup();
    recapState.isEmpty = false;
    recapState.canDownload = true;
    recapState.images = [
      {
        title: "Leituras de 7 de outubro de 2026 · 1/2",
        subtitle: null,
        coverSrcs: ["/a.jpg"],
      },
      {
        title: "Leituras de 7 de outubro de 2026 · 2/2",
        subtitle: null,
        coverSrcs: ["/b.jpg"],
      },
    ];
    recapState.currentImage = recapState.images[0];

    render(<ReadingRecapModal isOpen onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Baixar" }));
    await user.click(screen.getByRole("button", { name: "Baixar todas" }));

    expect(recapState.downloadCurrent).toHaveBeenCalledOnce();
    expect(recapState.downloadAll).toHaveBeenCalledOnce();
    expect(screen.queryByText("1/2", { exact: true })).not.toBeInTheDocument();
  });
});
