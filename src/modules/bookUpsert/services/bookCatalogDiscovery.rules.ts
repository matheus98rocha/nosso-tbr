import type { Status } from "@/types/books.types";

export function userParticipatesInBook(
  currentUserId: string | undefined,
  chosenBy: string | null | undefined,
  readers: string[],
): boolean {
  if (!currentUserId) return false;
  if (chosenBy && chosenBy === currentUserId) return true;
  return readers.includes(currentUserId);
}

/**
 * Identifica o "outro" leitor do registro para checagem de mútuo seguir:
 * prioriza `chosen_by` quando for terceiro; senão o primeiro em `readers` ≠ atual.
 */
export function pickCounterpartReaderId(
  chosenBy: string | null | undefined,
  readers: string[],
  currentUserId: string | undefined,
): string | null {
  if (!currentUserId) return null;
  if (chosenBy && chosenBy !== currentUserId) return chosenBy;
  const other = readers.find((id) => id !== currentUserId);
  return other ?? null;
}

export function isSuggestJoinReadingAllowed(
  userParticipates: boolean,
  bookStatus: Status | null | undefined,
  mutualFollow: boolean,
): boolean {
  if (userParticipates) return false;
  if (bookStatus !== "not_started") return false;
  return mutualFollow;
}
