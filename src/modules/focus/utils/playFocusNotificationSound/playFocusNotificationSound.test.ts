import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { playFocusNotificationSound } from "./playFocusNotificationSound";

const { mockClose, mockResume } = vi.hoisted(() => ({
  mockClose: vi.fn<() => Promise<void>>(),
  mockResume: vi.fn<() => Promise<void>>(),
}));

type FakeOscillator = {
  type: OscillatorType;
  frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};

type FakeGain = {
  gain: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
};

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];

  currentTime = 0;
  destination = {} as AudioDestinationNode;
  oscillators: FakeOscillator[] = [];
  gains: FakeGain[] = [];
  resume = mockResume;
  close = mockClose;

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createOscillator(): OscillatorNode {
    const oscillator: FakeOscillator = {
      type: "sine",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }

  createGain(): GainNode {
    const gain: FakeGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    this.gains.push(gain);
    return gain as unknown as GainNode;
  }
}

describe("playFocusNotificationSound", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    FakeAudioContext.instances = [];
    mockResume.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    vi.stubGlobal("AudioContext", FakeAudioContext);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("toca três notas em sequência e fecha o contexto ao terminar", () => {
    playFocusNotificationSound();

    const context = FakeAudioContext.instances[0];

    expect(context.oscillators).toHaveLength(3);
    expect(context.gains).toHaveLength(3);
    expect(context.oscillators[0].start).toHaveBeenCalledWith(0);
    expect(context.oscillators[1].start).toHaveBeenCalledWith(0.24);
    expect(context.oscillators[2].start).toHaveBeenCalledWith(0.48);
    expect(mockResume).toHaveBeenCalledTimes(1);
    expect(mockClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it("não lança erro quando o navegador não oferece Web Audio", () => {
    vi.stubGlobal("AudioContext", undefined);

    expect(() => playFocusNotificationSound()).not.toThrow();
    expect(FakeAudioContext.instances).toHaveLength(0);
  });
});
