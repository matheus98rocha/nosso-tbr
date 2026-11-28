"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  FocusActiveSession,
  FocusPageProgress,
  FocusSession,
} from "../../types/focus.types";
import {
  appendFocusSession,
  clearFocusActive,
  loadFocusActive,
  loadFocusPages,
  loadFocusSessions,
  saveFocusActive,
  saveFocusPage,
} from "../../utils/focusStorage";

type FocusSnapshot = {
  active: FocusActiveSession | null;
  sessions: FocusSession[];
  pages: FocusPageProgress;
};

const EMPTY_SNAPSHOT: FocusSnapshot = {
  active: null,
  sessions: [],
  pages: {},
};

export function useFocusStorage(userId: string | undefined) {
  const [snapshot, setSnapshot] = useState<FocusSnapshot>(EMPTY_SNAPSHOT);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      setSnapshot(EMPTY_SNAPSHOT);
      setIsReady(true);
      return;
    }

    setSnapshot({
      active: loadFocusActive(userId),
      sessions: loadFocusSessions(userId),
      pages: loadFocusPages(userId),
    });
    setIsReady(true);
  }, [userId]);

  const persistActive = useCallback(
    (active: FocusActiveSession) => {
      if (!userId) return;

      saveFocusActive(userId, active);
      setSnapshot((current) => ({ ...current, active }));
    },
    [userId],
  );

  const discardActive = useCallback(() => {
    if (!userId) return;

    clearFocusActive(userId);
    setSnapshot((current) => ({ ...current, active: null }));
  }, [userId]);

  const addSession = useCallback(
    (session: FocusSession) => {
      if (!userId) return;

      const sessions = appendFocusSession(userId, session);
      setSnapshot((current) => ({ ...current, sessions }));
    },
    [userId],
  );

  const savePage = useCallback(
    (bookId: string, page: number) => {
      if (!userId) return;

      const pages = saveFocusPage(userId, bookId, page);
      setSnapshot((current) => ({ ...current, pages }));
    },
    [userId],
  );

  return {
    active: snapshot.active,
    sessions: snapshot.sessions,
    pages: snapshot.pages,
    isReady,
    persistActive,
    discardActive,
    addSession,
    savePage,
  };
}
