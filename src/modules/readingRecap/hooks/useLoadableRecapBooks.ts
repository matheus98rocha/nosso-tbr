import { useEffect, useMemo, useState } from "react";

import type { RecapBook, UseLoadableRecapBooksResult } from "../types";
import { recapBookCoverSrc } from "../utils/buildReadingRecap";
import { probeRecapCoverSrcs } from "../utils/probeRecapCoverSrc";

export function useLoadableRecapBooks(
  books: RecapBook[],
): UseLoadableRecapBooksResult {
  const [probedKey, setProbedKey] = useState("");

  const candidateSrcs = useMemo(
    () => books.map((book) => recapBookCoverSrc(book.imageUrl)),
    [books],
  );
  const coverKey = candidateSrcs.join("\0");

  useEffect(() => {
    let cancelled = false;
    const srcs = coverKey === "" ? [] : coverKey.split("\0");

    if (srcs.length === 0) {
      setProbedKey(coverKey);
      return () => {
        cancelled = true;
      };
    }

    void probeRecapCoverSrcs(srcs).then(() => {
      if (cancelled) return;
      setProbedKey(coverKey);
    });

    return () => {
      cancelled = true;
    };
  }, [coverKey]);

  return {
    loadableBooks: books,
    isProbing: probedKey !== coverKey,
  };
}

export default useLoadableRecapBooks;
