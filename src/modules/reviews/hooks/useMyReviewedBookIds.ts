"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useUserStore } from "@/stores/userStore";

import { ReviewsService } from "../services";
import { reviewQueryKeys } from "../utils";

const service = new ReviewsService();

export function useMyReviewedBookIds() {
  const userId = useUserStore((state) => state.user?.id);

  const query = useQuery({
    queryKey: reviewQueryKeys.myBookIds(userId ?? "anon"),
    queryFn: () => service.listMyBookIds(),
    enabled: Boolean(userId),
    staleTime: 1000 * 30,
  });

  const ids = useMemo(() => new Set(query.data ?? []), [query.data]);

  return { ids, isLoading: query.isLoading };
}
