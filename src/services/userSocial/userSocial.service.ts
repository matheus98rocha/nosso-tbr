import { createClient } from "@/lib/supabase/client";
import { UserSocialMapper } from "./mappers/userSocial.mapper";
import { DirectoryUser } from "./types/userSocial.types";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";

export class UserSocialService {
  private supabase = createClient();

  async searchUsers(search: string): Promise<DirectoryUser[]> {
    try {
      const q = search.trim();
      let query = this.supabase
        .from("users")
        .select("id, display_name, email")
        .order("display_name", { ascending: true })
        .limit(80);

      if (q.length > 0) {
        const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
        query = query.or(
          `display_name.ilike.%${escaped}%,email.ilike.%${escaped}%`,
        );
      }

      const { data, error } = await query;

      if (error) {
        throw new RepositoryError(
          "Failed to load users",
          undefined,
          undefined,
          error,
          { search: q },
        );
      }

      return (data ?? []).map(UserSocialMapper.toDirectoryUser);
    } catch (error) {
      const normalized = ErrorHandler.normalize(error, {
        service: "UserSocialService",
        method: "searchUsers",
      });
      ErrorHandler.log(normalized);
      throw normalized;
    }
  }

  async getFollowingIds(): Promise<string[]> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError || !user) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("user_followers")
      .select("following_id")
      .eq("follower_id", user.id);

    if (error) {
      throw new RepositoryError(
        "Failed to load follows",
        undefined,
        undefined,
        error,
      );
    }

    return (data ?? []).map((row) => row.following_id as string);
  }

  async follow(followingId: string): Promise<void> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new RepositoryError("Unauthorized", undefined, undefined, authError);
    }

    if (user.id === followingId) {
      throw new RepositoryError("Cannot follow yourself");
    }

    const { error } = await this.supabase.from("user_followers").insert({
      follower_id: user.id,
      following_id: followingId,
    });

    if (error) {
      throw new RepositoryError(
        "Failed to follow user",
        undefined,
        undefined,
        error,
        { followingId },
      );
    }
  }

  async unfollow(followingId: string): Promise<void> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new RepositoryError("Unauthorized", undefined, undefined, authError);
    }

    const { error } = await this.supabase
      .from("user_followers")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);

    if (error) {
      throw new RepositoryError(
        "Failed to unfollow user",
        undefined,
        undefined,
        error,
        { followingId },
      );
    }
  }
}
