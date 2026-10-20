"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useClientMounted } from "@/modules/profile/hooks/useClientMounted";

import {
  readPopularReadersHidden,
  writePopularReadersHidden,
} from "../utils/popularReadersPreference";

export default function usePopularReadersPreference(userId: string | undefined) {
  const isClientReady = useClientMounted();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!isClientReady || !userId) {
      setHidden(false);
      return;
    }

    setHidden(readPopularReadersHidden(userId));
  }, [isClientReady, userId]);

  const hide = useCallback(() => {
    if (!userId) {
      return;
    }

    writePopularReadersHidden(userId, true);
    setHidden(true);
  }, [userId]);

  const show = useCallback(() => {
    if (!userId) {
      return;
    }

    writePopularReadersHidden(userId, false);
    setHidden(false);
  }, [userId]);

  return useMemo(
    () => ({
      hidden: Boolean(userId) && hidden,
      hide,
      show,
      isReady: isClientReady,
    }),
    [hidden, hide, isClientReady, show, userId],
  );
}
