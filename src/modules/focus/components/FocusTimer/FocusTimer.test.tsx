import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FocusTimerStatus } from "../../types/focus.types";

const { mockPause, mockReset, mockSetDurationMinutes, mockStart } =
  vi.hoisted(() => ({
    mockPause: vi.fn(),
    mockReset: vi.fn(),
    mockSetDurationMinutes: vi.fn(),
    mockStart: vi.fn(),
  }));

vi.mock("../../hooks/useFocusTimer", () => ({
  useFocusTimer: vi.fn(),
}));

vi.mock("../../utils/playFocusNotificationSound", () => ({
  playFocusNotificationSound: vi.fn(),
}));

import { useFocusTimer } from "../../hooks/useFocusTimer";
import { FocusTimer } from "./FocusTimer";

const mockedUseFocusTimer = vi.mocked(useFocusTimer);

function mockTimer(status: FocusTimerStatus = "idle") {
  mockedUseFocusTimer.mockReturnValue({
    durationSeconds: 1500,
    remainingSeconds: 1500,
    status,
    progress: status === "finished" ? 100 : 0,
    setDurationMinutes: mockSetDurationMinutes,
    start: mockStart,
    pause: mockPause,
    reset: mockReset,
  });
}

describe("FocusTimer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTimer();
  });

  it("mostra o tempo restante e o estado inicial", () => {
    render(<FocusTimer />);

    expect(screen.getByRole("timer", { name: "Tempo restante" })).toHaveTextContent(
      "25:00",
    );
    expect(screen.getByText("Pronto para começar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar foco" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reiniciar" })).toBeDisabled();
  });

  it("aplica uma duração sugerida", async () => {
    const user = userEvent.setup();
    render(<FocusTimer />);

    await user.click(screen.getByRole("button", { name: "15 min" }));

    expect(mockSetDurationMinutes).toHaveBeenCalledWith(15);
    expect(screen.getByLabelText("Ou defina seu tempo")).toHaveValue(15);
  });

  it("aplica uma duração personalizada", async () => {
    const user = userEvent.setup();
    render(<FocusTimer />);

    const input = screen.getByLabelText("Ou defina seu tempo");
    await user.clear(input);
    await user.type(input, "30");
    await user.click(screen.getByRole("button", { name: "Definir" }));

    expect(mockSetDurationMinutes).toHaveBeenCalledWith(30);
  });

  it("recusa duração fora do intervalo permitido", async () => {
    const user = userEvent.setup();
    render(<FocusTimer />);

    const input = screen.getByLabelText("Ou defina seu tempo");
    await user.clear(input);
    await user.type(input, "200");
    await user.click(screen.getByRole("button", { name: "Definir" }));

    expect(mockSetDurationMinutes).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("1 e 180 minutos");
  });

  it("pausa e reinicia enquanto o cronômetro está ativo", async () => {
    const user = userEvent.setup();
    mockTimer("running");
    render(<FocusTimer />);

    await user.click(screen.getByRole("button", { name: "Pausar" }));
    await user.click(screen.getByRole("button", { name: "Reiniciar" }));

    expect(mockPause).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "15 min" })).toBeDisabled();
  });

  it("oferece recomeçar quando o tempo termina", async () => {
    const user = userEvent.setup();
    mockTimer("finished");
    render(<FocusTimer />);

    expect(screen.getByRole("status")).toHaveTextContent("Seu tempo acabou");

    await user.click(screen.getByRole("button", { name: "Começar de novo" }));

    expect(mockStart).toHaveBeenCalledTimes(1);
  });
});
