import { useCallback, useEffect, useMemo, useState } from "react";

import { isRegisteredBookCoverUrl } from "@/constants/bookCover";

import type { UseVisibleRecapCoversResult } from "../types";

export function useVisibleRecapCovers(
  coverSrcs: string[],
): UseVisibleRecapCoversResult {
  const [failedSrcs, setFailedSrcs] = useState<string[]>([]);
  const coverKey = coverSrcs.join("\0");

  useEffect(() => {
    setFailedSrcs([]);
  }, [coverKey]);

  const visibleCoverSrcs = useMemo(() => {
    const failed = new Set(failedSrcs);
    return coverSrcs.filter(
      (src) => isRegisteredBookCoverUrl(src) && !failed.has(src),
    );
  }, [coverSrcs, failedSrcs]);

  const handleCoverError = useCallback((src: string) => {
    setFailedSrcs((current) =>
      current.includes(src) ? current : [...current, src],
    );
  }, []);

  return {
    visibleCoverSrcs,
    handleCoverError,
  };
}

export default useVisibleRecapCovers;
