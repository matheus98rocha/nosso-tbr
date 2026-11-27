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

export function playFocusNotificationSound(): void {
  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) return;

  let context: AudioContext;

  try {
    context = new AudioContextConstructor();
  } catch {
    return;
  }

  NOTE_FREQUENCIES.forEach((frequency, index) => {
    const startAt =
      context.currentTime +
      index * (NOTE_DURATION_SECONDS + NOTE_GAP_SECONDS);

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startAt + NOTE_DURATION_SECONDS,
    );

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + NOTE_DURATION_SECONDS);
  });

  void context.resume().catch(() => undefined);

  const totalDurationMs =
    (NOTE_FREQUENCIES.length * (NOTE_DURATION_SECONDS + NOTE_GAP_SECONDS) +
      0.2) *
    1000;

  window.setTimeout(() => {
    void context.close().catch(() => undefined);
  }, totalDurationMs);
}
