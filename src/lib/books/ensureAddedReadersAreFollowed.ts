import type { SupabaseClient } from "@supabase/supabase-js";

import { addedReaderIds } from "./addedReaderIds";

export const UNFOLLOWED_READER_ERROR =
  "Você só pode adicionar pessoas que segue";

type FollowCheckResult = {
  error: string;
  status: 403 | 500;
} | null;

export async function ensureAddedReadersAreFollowed(
  supabase: SupabaseClient,
  actorId: string,
  currentReaders: readonly string[] | null | undefined,
  nextReaders: readonly string[],
): Promise<FollowCheckResult> {
  const added = addedReaderIds(currentReaders, nextReaders, actorId);

  if (added.length === 0) return null;

  const { data, error } = await supabase
    .from("user_followers")
    .select("following_id")
    .eq("follower_id", actorId)
    .in("following_id", added);

  if (error) {
    return {
      error: "Não foi possível confirmar quem você segue",
      status: 500,
    };
  }

  const followed = new Set(
    (data ?? []).map((row) => row.following_id).filter(Boolean),
  );

  if (added.some((readerId) => !followed.has(readerId))) {
    return { error: UNFOLLOWED_READER_ERROR, status: 403 };
  }

  return null;
}
