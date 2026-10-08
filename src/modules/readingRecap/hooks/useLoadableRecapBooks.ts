import { useCallback, useEffect, useMemo, useState } from "react";

import type { RecapBook, UseLoadableRecapBooksResult } from "../types";
import { recapBookCoverSrc } from "../utils/buildReadingRecap";
import { probeRecapCoverSrcs } from "../utils/probeRecapCoverSrc";

export function useLoadableRecapBooks(
  books: RecapBook[],
): UseLoadableRecapBooksResult {
  const [failedSrcs, setFailedSrcs] = useState<string[]>([]);
  const [probedKey, setProbedKey] = useState("");

  const candidateSrcs = useMemo(
    () =>
      books.flatMap((book) => {
        const src = recapBookCoverSrc(book.imageUrl);
        return src ? [src] : [];
      }),
    [books],
  );
  const coverKey = candidateSrcs.join("\0");

  const markCoverFailed = useCallback((src: string) => {
    setFailedSrcs((current) =>
      current.includes(src) ? current : [...current, src],
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    const srcs = coverKey === "" ? [] : coverKey.split("\0");

    if (srcs.length === 0) {
      setFailedSrcs([]);
      setProbedKey(coverKey);
      return () => {
        cancelled = true;
      };
    }

    void probeRecapCoverSrcs(srcs).then((failed) => {
      if (cancelled) return;
      setFailedSrcs(failed);
      setProbedKey(coverKey);
    });

    return () => {
      cancelled = true;
    };
  }, [coverKey]);

  const loadableBooks = useMemo(() => {
    const failed = new Set(failedSrcs);
    return books.filter((book) => {
      const src = recapBookCoverSrc(book.imageUrl);
      return Boolean(src && !failed.has(src));
    });
  }, [books, failedSrcs]);

  return {
    loadableBooks,
    isProbing: probedKey !== coverKey,
    markCoverFailed,
  };
}

export default useLoadableRecapBooks;
