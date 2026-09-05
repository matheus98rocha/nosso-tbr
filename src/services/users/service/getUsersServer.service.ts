import { createClient } from "@/lib/supabase/server";

import { UsersMapper } from "../mappers/users.mapper";
import { UserDomain } from "../types/users.types";
import { buildNetworkUserIds } from "../utils/buildNetworkUserIds";

export async function getUsersServer(): Promise<UserDomain[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data: followingRows, error: followingError } = await supabase
    .from("user_followers")
    .select("following_id")
    .eq("follower_id", user.id);

  if (followingError) {
    throw new Error(followingError.message);
  }

  const followingIds = (followingRows ?? []).map(
    (row) => row.following_id as string,
  );
  const networkIds = buildNetworkUserIds(user.id, followingIds);

  const { data, error } = await supabase
    .from("users")
    .select("id, display_name")
    .in("id", networkIds)
    .order("display_name");

  if (error) {
    throw new Error(error.message);
  }

  return data?.map(UsersMapper.toDomain) ?? [];
}
