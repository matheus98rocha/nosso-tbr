import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { UserSocialService } from "@/services/userSocial/userSocial.service";

import type { FollowRecommendation } from "../types/onboarding.types";
import {
  FOLLOW_RECOMMENDATION_LIMIT,
  rankFollowRecommendations,
} from "../utils/rankFollowRecommendations";

type CommunityGenreRpcRow = {
  reader_id: string;
  gender: string;
  finished_count: number;
  registered_count: number;
};

type CommunityActivityRpcRow = {
  reader_id: string;
  registered_count: number;
  finished_count: number;
  currently_reading_title: string | null;
};

type UserDirectoryRow = {
  id: string;
  display_name: string | null;
  avatar_seed: string | null;
};

type OnboardingSupabase = {
  from: SupabaseClient["from"];
  rpc: SupabaseClient["rpc"];
};

export class OnboardingService {
  private readonly supabase: OnboardingSupabase;
  private readonly userSocial: UserSocialService;

  constructor(client?: OnboardingSupabase, userSocial?: UserSocialService) {
    this.supabase = client ?? (createClient() as OnboardingSupabase);
    this.userSocial = userSocial ?? new UserSocialService();
  }

  async markWelcomeTutorialSeen(userId: string): Promise<string> {
    try {
      const seenAt = new Date().toISOString();
      const { error } = await this.supabase
        .from("users")
        .update({ welcome_tutorial_seen_at: seenAt })
        .eq("id", userId)
        .is("welcome_tutorial_seen_at", null);

      if (error) {
        throw new RepositoryError(
          "Failed to mark welcome tutorial as seen",
          undefined,
          undefined,
          error,
        );
      }

      return seenAt;
    } catch (error) {
      const normalized = ErrorHandler.normalize(error, {
        service: "OnboardingService",
        method: "markWelcomeTutorialSeen",
      });
      ErrorHandler.log(normalized);
      throw normalized;
    }
  }

  async getFollowRecommendations(
    selfId: string,
    limit: number = FOLLOW_RECOMMENDATION_LIMIT,
  ): Promise<FollowRecommendation[]> {
    try {
      const [usersResult, followingIds, genresResult, activityResult] =
        await Promise.all([
          this.supabase
            .from("users")
            .select("id, display_name, avatar_seed")
            .order("display_name", { ascending: true }),
          this.userSocial.getFollowingIds(),
          this.supabase.rpc("get_community_reader_genres"),
          this.supabase.rpc("get_community_reader_activity"),
        ]);

      if (usersResult.error) {
        throw new RepositoryError(
          "Failed to load readers for recommendations",
          undefined,
          undefined,
          usersResult.error,
        );
      }

      if (genresResult.error) {
        throw new RepositoryError(
          "Failed to load community genres for recommendations",
          undefined,
          undefined,
          genresResult.error,
        );
      }

      if (activityResult.error) {
        throw new RepositoryError(
          "Failed to load community activity for recommendations",
          undefined,
          undefined,
          activityResult.error,
        );
      }

      const genreRows = (genresResult.data ?? []) as CommunityGenreRpcRow[];
      const activityRows = (activityResult.data ??
        []) as CommunityActivityRpcRow[];
      const users = (usersResult.data ?? []) as UserDirectoryRow[];

      const selfGenders = [
        ...new Set(
          genreRows
            .filter((row) => row.reader_id === selfId)
            .map((row) => row.gender)
            .filter((gender) => gender.trim().length > 0),
        ),
      ];

      const genresByReader = new Map<
        string,
        Array<{
          gender: string;
          finishedCount: number;
          registeredCount: number;
        }>
      >();

      for (const row of genreRows) {
        const list = genresByReader.get(row.reader_id) ?? [];
        list.push({
          gender: row.gender,
          finishedCount: row.finished_count,
          registeredCount: row.registered_count,
        });
        genresByReader.set(row.reader_id, list);
      }

      const activityByReader = new Map(
        activityRows.map((row) => [row.reader_id, row.registered_count]),
      );

      const candidates = users.map((row) => ({
        id: row.id,
        displayName: row.display_name ?? "",
        avatarSeed: row.avatar_seed,
        genreRows: genresByReader.get(row.id) ?? [],
        registeredCount: activityByReader.get(row.id) ?? 0,
      }));

      return rankFollowRecommendations({
        selfId,
        followingIds,
        selfGenders,
        candidates,
        limit,
      });
    } catch (error) {
      const normalized = ErrorHandler.normalize(error, {
        service: "OnboardingService",
        method: "getFollowRecommendations",
      });
      ErrorHandler.log(normalized);
      throw normalized;
    }
  }
}
