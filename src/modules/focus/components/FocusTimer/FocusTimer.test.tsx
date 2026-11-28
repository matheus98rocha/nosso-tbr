import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FocusBook } from "../../types/focus.types";
import type { FocusTimerProps } from "../../types/focus.components.types";
import FocusTimer from "./FocusTimer";

vi.mock("@/components/bookCover/bookCover", () => ({
  default: () => <span data-testid="focus-capa" />,
}));

const book: FocusBook = {
  id: "book-1",
  title: "O nome do vento",
  author: "Patrick Rothfuss",
  authorIds: ["author-1"],
  imageUrl: "https://example.com/capa.jpg",
  pages: 200,
  currentPage: 30,
  readerIds: ["user-1"],
  chosenBy: "user-1",
  userId: "user-1",
  startDate: "2026-01-01",
  gender: "Fantasia",
  isReread: false,
  status: "reading",
};

function makeProps(overrides: Partial<FocusTimerProps> = {}): FocusTimerProps {
  return {
    mode: "timer",
    status: "idle",
    displaySeconds: 1500,
    progress: 0,
    durationMinutes: 25,
    goalPages: null,
    estimatedPages: 25,
    remainingMinutes: 170,
    suggestedMinutes: null,
    speed: 1,
    book: null,
    books: [book],
    booksLoading: false,
    booksError: false,
    goalInput: "",
    inputError: null,
    muted: false,
    canFinish: false,
    onModeChange: vi.fn(),
    onBookChange: vi.fn(),
    onGoalInputChange: vi.fn(),
    onGoalSubmit: vi.fn(),
    onGoalPreset: vi.fn(),
    onGoalClear: vi.fn(),
    onAcceptSuggestion: vi.fn(),
    onDurationChange: vi.fn(),
    onToggleMute: vi.fn(),
    onStart: vi.fn(),
    onPause: vi.fn(),
    onReset: vi.fn(),
    onFinishSession: vi.fn(),
    ...overrides,
  };
}

describe("FocusTimer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra o tempo restante e o estado inicial", () => {
    render(<FocusTimer {...makeProps()} />);

    expect(screen.getByRole("timer", { name: "Tempo restante" })).toHaveTextContent(
      "25:00",
    );
    expect(screen.getByText("Pronto para começar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar foco" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reiniciar" })).toBeDisabled();
  });

  it("oferece capa, título, autor e progresso do livro vinculado", () => {
    render(<FocusTimer {...makeProps({ book })} />);

    expect(screen.getByTestId("focus-capa")).toBeInTheDocument();
    expect(screen.getAllByText("O nome do vento").length).toBeGreaterThan(0);
    expect(screen.getByText("Patrick Rothfuss")).toBeInTheDocument();
    expect(screen.getByText("Página 30 de 200")).toBeInTheDocument();
  });

  it("mostra a sugestão de tempo e permite aceitá-la em um clique", async () => {
    const user = userEvent.setup();
    const props = makeProps({
      goalPages: 20,
      goalInput: "20",
      durationMinutes: 25,
      suggestedMinutes: 20,
    });
    render(<FocusTimer {...props} />);

    expect(screen.getByText(/sugerimos/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Usar 20 min" }));

    expect(props.onAcceptSuggestion).toHaveBeenCalledTimes(1);
  });

  it("mostra as páginas prováveis quando o tempo é ajustado sem meta", () => {
    render(<FocusTimer {...makeProps({ estimatedPages: 37 })} />);

    expect(screen.getByText(/você deve ler cerca de/)).toHaveTextContent(
      "37 páginas",
    );
  });

  it("permite preenchimento rápido e livre de páginas", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<FocusTimer {...props} />);

    await user.click(screen.getByRole("button", { name: "10 pág." }));
    await user.type(screen.getByLabelText("Páginas pretendidas"), "30");
    await user.click(screen.getByRole("button", { name: "Definir meta" }));

    expect(props.onGoalPreset).toHaveBeenCalledWith(10);
    expect(props.onGoalInputChange).toHaveBeenCalled();
    expect(props.onGoalSubmit).toHaveBeenCalledTimes(1);
  });

  it("alterna entre timer regressivo e cronômetro livre", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<FocusTimer {...props} />);

    await user.click(screen.getByRole("button", { name: "Cronômetro livre" }));

    expect(props.onModeChange).toHaveBeenCalledWith("stopwatch");
  });

  it("inicia e pausa a sessão conforme o estado", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    const { rerender } = render(<FocusTimer {...props} />);

    await user.click(screen.getByRole("button", { name: "Iniciar foco" }));
    expect(props.onStart).toHaveBeenCalledTimes(1);

    rerender(<FocusTimer {...makeProps({ status: "running" })} />);
    await user.click(screen.getByRole("button", { name: "Pausar" }));
    expect(screen.getByRole("button", { name: "Pausar" })).toBeEnabled();
  });

  it("oferece encerramento manual de uma sessão válida", async () => {
    const user = userEvent.setup();
    const props = makeProps({ status: "paused", canFinish: true });
    render(<FocusTimer {...props} />);

    await user.click(screen.getByRole("button", { name: "Encerrar e registrar" }));

    expect(props.onFinishSession).toHaveBeenCalledTimes(1);
  });

  it("mostra mensagem quando o tempo acabou", () => {
    render(<FocusTimer {...makeProps({ status: "finished", progress: 100 })} />);

    expect(screen.getByRole("status")).toHaveTextContent("Seu tempo acabou");
    expect(screen.getByRole("button", { name: "Começar de novo" })).toBeEnabled();
  });
});
