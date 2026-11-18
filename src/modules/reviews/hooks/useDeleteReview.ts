"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { REVIEWS_COPY } from "../constants";
import { ReviewsService } from "../services";
import { reviewQueryKeys } from "../utils";

const service = new ReviewsService();

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => service.deleteReview(reviewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all });
    },
    onError: () => {
      toast.error(REVIEWS_COPY.deleteError, { className: "toast-error" });
    },
  });
}
