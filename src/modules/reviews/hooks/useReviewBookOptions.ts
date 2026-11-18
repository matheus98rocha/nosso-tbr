"use client";

import { useQuery } from "@tanstack/react-query";

import { useUserStore } from "@/stores/userStore";

import { ReviewsService } from "../services";
import { reviewQueryKeys } from "../utils";

const service = new ReviewsService();

export function useReviewBookOptions(enabled: boolean) {
  const userId = useUserStore((state) => state.user?.id);

  const reviewed = useQuery({
    queryKey: reviewQueryKeys.myBookIds(userId ?? "anon"),
    queryFn: () => service.listMyBookIds(),
    enabled: enabled && Boolean(userId),
  });

  const books = useQuery({
    queryKey: reviewQueryKeys.bookOptions(userId ?? "anon"),
    queryFn: () => service.listParticipatingBooks(reviewed.data ?? []),
    enabled: enabled && Boolean(userId) && reviewed.isSuccess,
  });

  return {
    books: books.data ?? [],
    isLoading: reviewed.isLoading || books.isLoading,
    isError: reviewed.isError || books.isError,
  };
}
