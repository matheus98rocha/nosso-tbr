"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createFocusAudioContext,
  playFocusSound,
  resumeFocusAudioContext,
} from "../../utils/playFocusSound";

export function useFocusSound(initialMuted = false) {
  const [muted, setMuted] = useState(initialMuted);
  const contextRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(initialMuted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const unlock = useCallback((force = false) => {
    if (mutedRef.current && !force) return;

    contextRef.current ??= createFocusAudioContext();
    resumeFocusAudioContext(contextRef.current);
  }, []);

  const play = useCallback(() => {
    if (mutedRef.current) return;

    playFocusSound(contextRef.current);
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((current) => !current);
  }, []);

  const setMutedState = useCallback((value: boolean) => {
    setMuted(value);
  }, []);

  return { muted, unlock, play, toggleMuted, setMuted: setMutedState };
}
