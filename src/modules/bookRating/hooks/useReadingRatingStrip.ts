import { canUserParticipateInBook } from "@/lib/security/bookParticipation";
import { BookDomain } from "@/types/books.types";
import { useUserStore } from "@/stores/userStore";
import { useRemoveReadingRatingMutation } from "@/modules/bookRating/hooks/useReadingRatingMutations";
import { useSaveReadingRatingMutation } from "@/modules/bookRating/hooks/useReadingRatingMutations";
import { useCallback, useMemo } from "react";

type UseReadingRatingStripArgs = {
  book: BookDomain;
};

export function useReadingRatingStrip({
  book,
}: UseReadingRatingStripArgs) {
  const userId = useUserStore((s) => s.user?.id);
  const bid = book.id ?? "";
  const { saveStars, isPending: isSaving } = useSaveReadingRatingMutation(
    userId,
  );
  const { removeRating, isPending: isRemoving } = useRemoveReadingRatingMutation(
    userId,
  );

  const participating = useMemo(() => {
    if (!userId || !bid) return false;
    return canUserParticipateInBook(userId, {
      user_id: book.user_id,
      chosen_by: book.chosen_by,
      readers: book.readerIds,
    });
  }, [bid, book.chosen_by, book.readerIds, book.user_id, userId]);

  const show = participating && book.status === "finished";

  const value = book.reading_rating_stars ?? null;

  const pick = useCallback(
    async (stars: number) => {
      if (!bid || stars < 1 || stars > 5) return;
      await saveStars(bid, stars);
    },
    [bid, saveStars],
  );

  const remove = useCallback(async () => {
    if (!bid) return;
    await removeRating(bid);
  }, [bid, removeRating]);

  const busy = isSaving || isRemoving;

  return useMemo(
    () => ({
      show,
      value,
      pick,
      remove,
      busy,
    }),
    [busy, pick, remove, show, value],
  );
}
