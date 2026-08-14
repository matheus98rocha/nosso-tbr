import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BOOK_COVER_PLACEHOLDER_SRC,
  resolveBookCoverUrl,
} from "@/constants/bookCover";

export function useBookCover(src: string | undefined | null) {
  const resolvedSrc = useMemo(() => resolveBookCoverUrl(src), [src]);
  const isPlaceholder = resolvedSrc === BOOK_COVER_PLACEHOLDER_SRC;

  const [imageSrc, setImageSrc] = useState(resolvedSrc);
  const [isLoading, setIsLoading] = useState(!isPlaceholder);

  useEffect(() => {
    setImageSrc(resolvedSrc);
    setIsLoading(resolvedSrc !== BOOK_COVER_PLACEHOLDER_SRC);
  }, [resolvedSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setImageSrc((current) => {
      if (current === BOOK_COVER_PLACEHOLDER_SRC) {
        return current;
      }
      return BOOK_COVER_PLACEHOLDER_SRC;
    });
    setIsLoading(false);
  }, []);

  return {
    imageSrc,
    isLoading,
    handleLoad,
    handleError,
  };
}
