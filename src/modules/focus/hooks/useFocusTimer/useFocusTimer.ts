"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FOCUS_DEFAULT_MINUTES } from "../../constants/focusTimer";
import type {
  FocusActiveSession,
  FocusMode,
  FocusTimerStatus,
} from "../../types/focus.types";
import { normalizeFocusMinutes } from "../../utils/normalizeFocusMinutes";

type Clock = {
  mode: FocusMode;
  status: FocusTimerStatus;
  durationSeconds: number;
  accumulatedSeconds: number;
  startedAt: number | null;
  endsAt: number | null;
};

type UseFocusTimerOptions = {
  mode?: FocusMode;
  durationMinutes?: number;
  onFinish?: () => void;
};

function createClock(mode: FocusMode, durationMinutes: number): Clock {
  const durationSeconds =
    (normalizeFocusMinutes(durationMinutes) ?? FOCUS_DEFAULT_MINUTES) * 60;

  return {
    mode,
    status: "idle",
    durationSeconds,
    accumulatedSeconds: 0,
    startedAt: null,
    endsAt: null,
  };
}

function getRemainingSeconds(clock: Clock, now: number): number {
  if (clock.mode === "stopwatch") {
    return Math.max(0, clock.durationSeconds - clock.accumulatedSeconds);
  }

  if (clock.status === "running" && clock.endsAt !== null) {
    return Math.max(0, Math.ceil((clock.endsAt - now) / 1000));
  }

  return Math.max(0, clock.durationSeconds - clock.accumulatedSeconds);
}

function getElapsedSeconds(clock: Clock, now: number): number {
  const runningSeconds =
    clock.status === "running" && clock.startedAt !== null
      ? Math.max(0, Math.floor((now - clock.startedAt) / 1000))
      : 0;

  if (clock.mode === "stopwatch") {
    return clock.accumulatedSeconds + runningSeconds;
  }

  return Math.max(0, clock.durationSeconds - getRemainingSeconds(clock, now));
}

export function useFocusTimer({
  mode = "timer",
  durationMinutes = FOCUS_DEFAULT_MINUTES,
  onFinish,
}: UseFocusTimerOptions = {}) {
  const [clock, setClock] = useState<Clock>(() => createClock(mode, durationMinutes));
  const [now, setNow] = useState(() => Date.now());
  const clockRef = useRef(clock);
  const onFinishRef = useRef(onFinish);
  const finishNotifiedRef = useRef(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const applyClock = useCallback(
    (next: Clock | ((current: Clock) => Clock)) => {
      const value = typeof next === "function" ? next(clockRef.current) : next;

      clockRef.current = value;
      setClock(value);
    },
    [],
  );

  const tick = useCallback(() => {
    const current = clockRef.current;
    const currentTime = Date.now();

    setNow(currentTime);

    if (
      current.status !== "running" ||
      current.mode !== "timer" ||
      current.endsAt === null ||
      currentTime < current.endsAt
    ) {
      return;
    }

    applyClock({
      ...current,
      status: "finished",
      startedAt: null,
      endsAt: null,
      accumulatedSeconds: current.durationSeconds,
    });

    if (!finishNotifiedRef.current) {
      finishNotifiedRef.current = true;
      onFinishRef.current?.();
    }
  }, [applyClock]);

  useEffect(() => {
    if (clock.status !== "running") return;

    const intervalId = window.setInterval(tick, 250);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") tick();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    tick();

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clock.status, tick]);

  const remainingSeconds = useMemo(
    () => getRemainingSeconds(clock, now),
    [clock, now],
  );
  const elapsedSeconds = useMemo(() => getElapsedSeconds(clock, now), [clock, now]);
  const durationSeconds = clock.durationSeconds;

  const progress = useMemo(() => {
    if (clock.mode !== "timer" || durationSeconds <= 0) return 0;

    return Math.min(
      100,
      Math.max(0, Math.round(((durationSeconds - remainingSeconds) / durationSeconds) * 100)),
    );
  }, [clock.mode, durationSeconds, remainingSeconds]);

  const start = useCallback(() => {
    const current = clockRef.current;

    if (current.status === "running") return;

    const startedAt = Date.now();
    const accumulatedSeconds =
      current.status === "finished" ? 0 : current.accumulatedSeconds;
    const endsAt =
      current.mode === "timer"
        ? startedAt + Math.max(0, current.durationSeconds - accumulatedSeconds) * 1000
        : null;

    finishNotifiedRef.current = false;
    applyClock({
      ...current,
      status: "running",
      startedAt,
      endsAt,
      accumulatedSeconds,
    });
    setNow(startedAt);
  }, [applyClock]);

  const pause = useCallback(() => {
    const current = clockRef.current;

    if (current.status !== "running") return;

    const currentTime = Date.now();
    const accumulatedSeconds = getElapsedSeconds(current, currentTime);

    applyClock({
      ...current,
      status: "paused",
      startedAt: null,
      endsAt: null,
      accumulatedSeconds,
    });
    setNow(currentTime);
  }, [applyClock]);

  const reset = useCallback(() => {
    const current = clockRef.current;

    finishNotifiedRef.current = false;
    applyClock({
      ...createClock(current.mode, current.durationSeconds / 60),
      durationSeconds: current.durationSeconds,
    });
    setNow(Date.now());
  }, [applyClock]);

  const finish = useCallback(() => {
    const current = clockRef.current;
    const seconds = getElapsedSeconds(current, Date.now());

    finishNotifiedRef.current = true;
    applyClock({
      ...current,
      status: "finished",
      startedAt: null,
      endsAt: null,
      accumulatedSeconds: seconds,
    });

    return seconds;
  }, [applyClock]);

  const setDurationMinutes = useCallback(
    (minutes: number) => {
      const current = clockRef.current;

      if (current.status === "running") return;

      const normalizedMinutes = normalizeFocusMinutes(minutes);

      if (normalizedMinutes === null) return;

      finishNotifiedRef.current = false;
      applyClock({
        ...createClock(current.mode, normalizedMinutes),
        mode: current.mode,
      });
      setNow(Date.now());
    },
    [applyClock],
  );

  const setMode = useCallback(
    (nextMode: FocusMode) => {
      const current = clockRef.current;

      if (current.status === "running" || current.mode === nextMode) return;

      finishNotifiedRef.current = false;
      applyClock(createClock(nextMode, current.durationSeconds / 60));
      setNow(Date.now());
    },
    [applyClock],
  );

  const restore = useCallback(
    (snapshot: FocusActiveSession | null) => {
      if (!snapshot) return;

      const currentTime = Date.now();
      const startedAt = snapshot.startedAt
        ? new Date(snapshot.startedAt).getTime()
        : null;
      const endsAt = snapshot.endsAt ? new Date(snapshot.endsAt).getTime() : null;
      const status: FocusTimerStatus =
        snapshot.status === "running" &&
        snapshot.mode === "timer" &&
        endsAt !== null &&
        endsAt <= currentTime
          ? "running"
          : snapshot.status;

      finishNotifiedRef.current = status === "finished";
      applyClock({
        mode: snapshot.mode,
        status,
        startedAt: Number.isFinite(startedAt) ? startedAt : null,
        endsAt: Number.isFinite(endsAt) ? endsAt : null,
        accumulatedSeconds: snapshot.accumulatedSeconds,
        durationSeconds: snapshot.durationSeconds,
      });
      setNow(currentTime);
    },
    [applyClock],
  );

  return {
    mode: clock.mode,
    status: clock.status,
    durationSeconds,
    remainingSeconds,
    elapsedSeconds,
    displaySeconds: clock.mode === "stopwatch" ? elapsedSeconds : remainingSeconds,
    progress,
    startedAt: clock.startedAt === null ? null : new Date(clock.startedAt).toISOString(),
    endsAt: clock.endsAt === null ? null : new Date(clock.endsAt).toISOString(),
    accumulatedSeconds: clock.accumulatedSeconds,
    start,
    pause,
    reset,
    finish,
    setDurationMinutes,
    setMode,
    restore,
  };
}
