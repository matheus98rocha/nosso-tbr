import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFocusTimer } from "./useFocusTimer";

describe("useFocusTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });

  afterEach(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    vi.useRealTimers();
  });

  it("começa com 25 minutos no estado idle", () => {
    const { result } = renderHook(() => useFocusTimer());

    expect(result.current.remainingSeconds).toBe(1500);
    expect(result.current.status).toBe("idle");
    expect(result.current.progress).toBe(0);
  });

  it("aceita apenas durações entre 1 e 180 minutos", () => {
    const { result } = renderHook(() => useFocusTimer());

    act(() => {
      result.current.setDurationMinutes(1);
    });
    expect(result.current.remainingSeconds).toBe(60);

    act(() => {
      result.current.setDurationMinutes(0);
    });
    expect(result.current.remainingSeconds).toBe(60);

    act(() => {
      result.current.setDurationMinutes(181);
    });
    expect(result.current.remainingSeconds).toBe(60);

    act(() => {
      result.current.setDurationMinutes(180);
    });
    expect(result.current.remainingSeconds).toBe(10800);
  });

  it("conta, pausa e retoma de onde parou", () => {
    const { result } = renderHook(() => useFocusTimer());

    act(() => {
      result.current.setDurationMinutes(2);
    });
    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.remainingSeconds).toBe(118);

    act(() => {
      result.current.pause();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.remainingSeconds).toBe(118);
    expect(result.current.status).toBe("paused");

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.remainingSeconds).toBe(115);
    expect(result.current.status).toBe("running");
  });

  it("avisa uma única vez quando o tempo termina", () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => useFocusTimer({ onFinish }));

    act(() => {
      result.current.setDurationMinutes(1);
    });
    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.status).toBe("finished");
    expect(result.current.progress).toBe(100);
    expect(onFinish).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("detecta o fim ao voltar para a aba após ficar em segundo plano", () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => useFocusTimer({ onFinish }));

    act(() => {
      result.current.setDurationMinutes(1);
    });
    act(() => {
      result.current.start();
    });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    act(() => {
      vi.setSystemTime(Date.now() + 61_000);
    });
    expect(onFinish).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.status).toBe("finished");
  });

  it("reinicia para a duração definida", () => {
    const { result } = renderHook(() => useFocusTimer());

    act(() => {
      result.current.setDurationMinutes(1);
    });
    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.remainingSeconds).toBe(60);
    expect(result.current.status).toBe("idle");
    expect(result.current.progress).toBe(0);
  });

  it("reinicia o aviso ao começar de novo após terminar", () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => useFocusTimer({ onFinish }));

    act(() => {
      result.current.setDurationMinutes(1);
    });
    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("finished");

    act(() => {
      result.current.start();
    });

    expect(result.current.remainingSeconds).toBe(60);
    expect(result.current.status).toBe("running");

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onFinish).toHaveBeenCalledTimes(2);
  });

  it("ignora mudança de duração enquanto o cronômetro está ativo", () => {
    const { result } = renderHook(() => useFocusTimer());

    act(() => {
      result.current.setDurationMinutes(2);
    });
    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.setDurationMinutes(5);
    });

    expect(result.current.durationSeconds).toBe(120);
    expect(result.current.remainingSeconds).toBe(120);
    expect(result.current.status).toBe("running");
  });
});
