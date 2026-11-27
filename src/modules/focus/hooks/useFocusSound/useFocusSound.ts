"use client";

import { useCallback, useRef } from "react";

import {
  createFocusAudioContext,
  playFocusSound,
  resumeFocusAudioContext,
} from "../../utils/playFocusSound";

export function useFocusSound() {
  const contextRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(() => {
    contextRef.current ??= createFocusAudioContext();
    resumeFocusAudioContext(contextRef.current);
  }, []);

  const play = useCallback(() => {
    playFocusSound(contextRef.current);
  }, []);

  return { unlock, play };
}
