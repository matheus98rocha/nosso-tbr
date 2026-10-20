export const POPULAR_READERS_HIDE_STORAGE_PREFIX =
  "nosso-tbr:home:hide-popular-readers:";

export function getPopularReadersHideStorageKey(userId: string): string {
  return `${POPULAR_READERS_HIDE_STORAGE_PREFIX}${userId}`;
}

export function readPopularReadersHidden(userId: string): boolean {
  if (typeof window === "undefined" || !userId) {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(getPopularReadersHideStorageKey(userId)) ===
      "1"
    );
  } catch {
    return false;
  }
}

export function writePopularReadersHidden(
  userId: string,
  hidden: boolean,
): void {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  try {
    const key = getPopularReadersHideStorageKey(userId);
    if (hidden) {
      window.localStorage.setItem(key, "1");
      return;
    }
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
}
