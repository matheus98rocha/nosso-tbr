import type { QueryClient } from "@tanstack/react-query";

export function getReadingProgressSingleQueryKey(
  bookId: string,
  userId: string | undefined,
) {
  return ["schedule", bookId, "progress", userId] as const;
}

export function getReadingProgressManyQueryKey(
  bookIds: readonly string[],
  userId: string | undefined,
) {
  const sortedIds = [...bookIds].sort();
  return [
    "schedule",
    "progress",
    "many",
    sortedIds.join("|"),
    userId,
  ] as const;
}

export async function invalidateReadingProgressManyCaches(
  queryClient: QueryClient,
) {
  await queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return (
        Array.isArray(key) &&
        key[0] === "schedule" &&
        key[1] === "progress" &&
        key[2] === "many"
      );
    },
  });
}
