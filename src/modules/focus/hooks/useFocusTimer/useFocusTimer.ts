"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  FOCUS_DEFAULT_MINUTES,
  FOCUS_MAX_MINUTES,
  FOCUS_MIN_MINUTES,
} from "../../constants/focusTimer";
import type { FocusTimerStatus } from "../../types/focus.types";

type UseFocusTimerOptions = {
  onFinish?: () => void;
};

export function useFocusTimer({ onFinish }: UseFocusTimerOptions = {}) {
  const [durationSeconds, setDurationSeconds] = useState(
    FOCUS_DEFAULT_MINUTES * 60,
  );
  const [remainingSeconds, setRemainingSeconds] = useState(
    FOCUS_DEFAULT_MINUTES * 60,
  );
  const [status, setStatus] = useState<FocusTimerStatus>("idle");

  const deadlineRef = useRef<number | null>(null);
  const onFinishRef = useRef(onFinish);
  const finishNotifiedRef = useRef(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (status !== "running") return;

    const tick = () => {
      const deadline = deadlineRef.current;

      if (deadline === null) return;

      const nextRemaining = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000),
      );

      setRemainingSeconds(nextRemaining);

      if (nextRemaining > 0) return;

      deadlineRef.current = null;
      setStatus("finished");

      if (!finishNotifiedRef.current) {
        finishNotifiedRef.current = true;
        onFinishRef.current?.();
      }
    };

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
  }, [status]);

  const setDurationMinutes = useCallback((minutes: number) => {
    if (!Number.isFinite(minutes)) return;

    const roundedMinutes = Math.round(minutes);

    if (
      roundedMinutes < FOCUS_MIN_MINUTES ||
      roundedMinutes > FOCUS_MAX_MINUTES
    ) {
      return;
    }

    const nextDuration = roundedMinutes * 60;

    deadlineRef.current = null;
    finishNotifiedRef.current = false;
    setDurationSeconds(nextDuration);
    setRemainingSeconds(nextDuration);
    setStatus("idle");
  }, []);

  const start = useCallback(() => {
    if (status === "running") return;

    const seconds = status === "finished" ? durationSeconds : remainingSeconds;

    if (seconds <= 0) return;

    if (status === "finished") {
      setRemainingSeconds(durationSeconds);
      finishNotifiedRef.current = false;
    }

    deadlineRef.current = Date.now() + seconds * 1000;
    setStatus("running");
  }, [durationSeconds, remainingSeconds, status]);

  const pause = useCallback(() => {
    if (status !== "running") return;

    const deadline = deadlineRef.current;

    if (deadline !== null) {
      setRemainingSeconds(
        Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
      );
    }

    deadlineRef.current = null;
    setStatus("paused");
  }, [status]);

  const reset = useCallback(() => {
    deadlineRef.current = null;
    finishNotifiedRef.current = false;
    setRemainingSeconds(durationSeconds);
    setStatus("idle");
  }, [durationSeconds]);

  const progress =
    durationSeconds > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((durationSeconds - remainingSeconds) / durationSeconds) * 100,
            ),
          ),
        )
      : 0;

  return {
    durationSeconds,
    remainingSeconds,
    status,
    progress,
    setDurationMinutes,
    start,
    pause,
    reset,
  };
}
