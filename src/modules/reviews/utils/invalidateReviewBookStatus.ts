import type { QueryClient } from "@tanstack/react-query";

export function invalidateReviewBookStatus(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const root = query.queryKey[0];
      const kind = query.queryKey[1];
      return root === "reviews" && (kind === "books" || kind === "mine");
    },
  });
}
