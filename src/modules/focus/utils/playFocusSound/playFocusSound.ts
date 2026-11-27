type AudioContextConstructor = new () => AudioContext;

const NOTE_FREQUENCIES = [880, 1108.73, 1318.51];
const NOTE_DURATION_SECONDS = 0.18;
const NOTE_GAP_SECONDS = 0.06;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;

  const audioWindow = window as Window & {
    webkitAudioContext?: AudioContextConstructor;
  };

  return window.AudioContext ?? audioWindow.webkitAudioContext ?? null;
}

export function createFocusAudioContext(): AudioContext | null {
  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) return null;

  try {
    return new AudioContextConstructor();
  } catch {
    return null;
  }
}

export function resumeFocusAudioContext(context: AudioContext | null): void {
  if (!context) return;

  void context.resume().catch(() => undefined);
}

export function playFocusSound(context: AudioContext | null): void {
  const audioContext = context ?? createFocusAudioContext();

  if (!audioContext) return;

  resumeFocusAudioContext(audioContext);

  NOTE_FREQUENCIES.forEach((frequency, index) => {
    const startAt =
      audioContext.currentTime +
      index * (NOTE_DURATION_SECONDS + NOTE_GAP_SECONDS);

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startAt + NOTE_DURATION_SECONDS,
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + NOTE_DURATION_SECONDS);
  });
}
