import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createFocusAudioContext,
  playFocusSound,
  resumeFocusAudioContext,
} from "./playFocusSound";

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

describe("playFocusSound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FakeAudioContext.instances = [];
    mockResume.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    vi.stubGlobal("AudioContext", FakeAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("toca três notas em sequência em um contexto já desbloqueado", () => {
    const context = createFocusAudioContext();

    playFocusSound(context);

    const fakeContext = FakeAudioContext.instances[0];

    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(fakeContext.oscillators).toHaveLength(3);
    expect(fakeContext.gains).toHaveLength(3);
    expect(fakeContext.oscillators[0].start).toHaveBeenCalledWith(0);
    expect(fakeContext.oscillators[1].start).toHaveBeenCalledWith(0.24);
    expect(fakeContext.oscillators[2].start).toHaveBeenCalledWith(0.48);
    expect(mockResume).toHaveBeenCalledTimes(1);
    expect(mockClose).not.toHaveBeenCalled();
  });

  it("cria e reutiliza um contexto quando ainda não há um desbloqueado", () => {
    playFocusSound(null);

    expect(FakeAudioContext.instances).toHaveLength(1);

    playFocusSound(FakeAudioContext.instances[0] as unknown as AudioContext);

    expect(FakeAudioContext.instances).toHaveLength(1);
  });

  it("não lança erro quando o navegador não oferece Web Audio", () => {
    vi.stubGlobal("AudioContext", undefined);

    expect(createFocusAudioContext()).toBeNull();
    expect(() => playFocusSound(null)).not.toThrow();
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it("usa o prefixo webkit quando disponível", () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", FakeAudioContext);

    const context = createFocusAudioContext();

    expect(context).toBeInstanceOf(FakeAudioContext);
  });

  it("não lança erro quando o construtor do áudio é bloqueado", () => {
    vi.stubGlobal(
      "AudioContext",
      class {
        constructor() {
          throw new Error("blocked");
        }
      },
    );

    expect(createFocusAudioContext()).toBeNull();
    expect(() => playFocusSound(null)).not.toThrow();
    expect(mockResume).not.toHaveBeenCalled();
  });

  it("ignora um contexto nulo ao retomar o áudio", () => {
    expect(() => resumeFocusAudioContext(null)).not.toThrow();
    expect(mockResume).not.toHaveBeenCalled();
  });
});
