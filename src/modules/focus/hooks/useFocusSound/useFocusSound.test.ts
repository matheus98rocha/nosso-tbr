import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate, mockPlay, mockResume } = vi.hoisted(() => ({
  mockCreate: vi.fn<() => AudioContext | null>(),
  mockPlay: vi.fn<(context: AudioContext | null) => void>(),
  mockResume: vi.fn<(context: AudioContext | null) => void>(),
}));

vi.mock("../../utils/playFocusSound", () => ({
  createFocusAudioContext: mockCreate,
  playFocusSound: mockPlay,
  resumeFocusAudioContext: mockResume,
}));

import { useFocusSound } from "./useFocusSound";

const fakeContext = { currentTime: 0 } as unknown as AudioContext;

describe("useFocusSound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReturnValue(fakeContext);
  });

  it("cria e retoma o áudio uma única vez no gesto do usuário", () => {
    const { result } = renderHook(() => useFocusSound());

    act(() => {
      result.current.unlock();
      result.current.unlock();
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockResume).toHaveBeenCalledTimes(2);
    expect(mockResume).toHaveBeenNthCalledWith(1, fakeContext);
    expect(mockResume).toHaveBeenNthCalledWith(2, fakeContext);
  });

  it("toca o aviso no contexto desbloqueado", () => {
    const { result } = renderHook(() => useFocusSound());

    act(() => {
      result.current.unlock();
    });
    act(() => {
      result.current.play();
    });

    expect(mockPlay).toHaveBeenCalledWith(fakeContext);
  });

  it("silencia o aviso e volta a tocar depois de reativado", () => {
    const { result } = renderHook(() => useFocusSound());

    act(() => {
      result.current.toggleMuted();
    });
    act(() => {
      result.current.unlock();
      result.current.play();
    });

    expect(result.current.muted).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockPlay).not.toHaveBeenCalled();

    act(() => {
      result.current.setMuted(false);
    });
    act(() => {
      result.current.unlock();
      result.current.play();
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledWith(fakeContext);
  });
});
