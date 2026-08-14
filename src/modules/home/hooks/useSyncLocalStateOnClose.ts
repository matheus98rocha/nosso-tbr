import { FiltersOptions } from "@/types/filters";
import { useEffect, useRef } from "react";

type UseSyncLocalStateOnCloseParams<T> = {
  externalState: T;
  isOpen: boolean;
  syncLocalState: (state: T) => void;
  areEqual?: (previous: T, current: T) => boolean;
};

const areStringArraysEqual = (previous: string[] = [], current: string[] = []) => {
  if (previous.length !== current.length) {
    return false;
  }

  return previous.every((value, index) => value === current[index]);
};

export const areFiltersOptionsEqual = (
  previous: FiltersOptions,
  current: FiltersOptions,
) =>
  areStringArraysEqual(previous.readers, current.readers) &&
  areStringArraysEqual(previous.status, current.status) &&
  areStringArraysEqual(previous.gender, current.gender) &&
  previous.view === current.view &&
  previous.userId === current.userId &&
  previous.bookId === current.bookId &&
  previous.authorId === current.authorId &&
  previous.year === current.year &&
  previous.myBooks === current.myBooks &&
  previous.isReread === current.isReread &&
  previous.sort === current.sort;

export const useSyncLocalStateOnClose = <T>({
  externalState,
  isOpen,
  syncLocalState,
  areEqual = Object.is,
}: UseSyncLocalStateOnCloseParams<T>) => {
  const previousStateRef = useRef(externalState);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    const hasChanged = !areEqual(previousStateRef.current, externalState);

    if (!isOpen && wasOpenRef.current && hasChanged) {
      syncLocalState(externalState);
    }

    previousStateRef.current = externalState;
    wasOpenRef.current = isOpen;
  }, [areEqual, externalState, isOpen, syncLocalState]);
};
