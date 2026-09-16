import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { UserSocialService } from "@/services/userSocial/userSocial.service";
import type { Database } from "@/types/supabase";

import type {
  CommunityActivityRow,
  CommunityGenreRow,
  CommunityMember,
  CommunitySnapshot,
} from "../types/community.types";
import { pickTopGenre } from "../utils/pickTopGenre";
import { resolveCommunityDisplayName } from "../utils/resolveCommunityDisplayName";

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

export class CommunityService {
  private readonly supabase: SupabaseClient<Database>;
  private readonly userSocial: UserSocialService;

  constructor(
    client?: SupabaseClient<Database>,
    userSocial?: UserSocialService,
  ) {
    this.supabase = (client ?? createClient()) as SupabaseClient<Database>;
    this.userSocial = userSocial ?? new UserSocialService();
  }

  async getSnapshot(selfId: string): Promise<CommunitySnapshot> {
    try {
      const [
        usersResult,
        followingIds,
        followerIds,
        genresResult,
        activityResult,
      ] = await Promise.all([
        this.supabase
          .from("users")
          .select("id, display_name, avatar_seed")
          .order("display_name", { ascending: true }),
        this.userSocial.getFollowingIds(),
        this.userSocial.getFollowerIds(),
        this.supabase.rpc("get_community_reader_genres"),
        this.supabase.rpc("get_community_reader_activity"),
      ]);

      if (usersResult.error) {
        throw new RepositoryError(
          "Failed to load community members",
          undefined,
          undefined,
          usersResult.error,
        );
      }

      if (genresResult.error) {
        throw new RepositoryError(
          "Failed to load community genres",
          undefined,
          undefined,
          genresResult.error,
        );
      }

      if (activityResult.error) {
        throw new RepositoryError(
          "Failed to load community activity",
          undefined,
          undefined,
          activityResult.error,
        );
      }

      const followingSet = new Set(followingIds);
      const followerSet = new Set(followerIds);
      const genresByReader = groupGenreRows(
        mapGenreRows(genresResult.data ?? []),
      );
      const activityByReader = mapActivityByReader(activityResult.data ?? []);

      const members: CommunityMember[] = (usersResult.data ?? [])
        .filter((row) => row.id !== selfId)
        .map((row) => {
          const genreRows = genresByReader.get(row.id) ?? [];
          const activity = activityByReader.get(row.id);

          return {
            id: row.id,
            displayName: resolveCommunityDisplayName(row.display_name),
            avatarSeed: row.avatar_seed ?? null,
            isFollowing: followingSet.has(row.id),
            isFollower: followerSet.has(row.id),
            mostReadGender: pickTopGenre(
              genreRows.map((item) => ({
                gender: item.gender,
                count: item.finishedCount,
              })),
            ),
            mostRegisteredGender: pickTopGenre(
              genreRows.map((item) => ({
                gender: item.gender,
                count: item.registeredCount,
              })),
            ),
            registeredCount: activity?.registeredCount ?? 0,
            finishedCount: activity?.finishedCount ?? 0,
            currentlyReadingTitle: activity?.currentlyReadingTitle ?? null,
          };
        });

      return {
        members,
        followingIds,
        followerIds,
      };
    } catch (error) {
      const normalized = ErrorHandler.normalize(error, {
        service: "CommunityService",
        method: "getSnapshot",
      });
      ErrorHandler.log(normalized);
      throw normalized;
    }
  }
}

function mapGenreRows(rows: CommunityGenreRpcRow[]): CommunityGenreRow[] {
  return rows.map((row) => ({
    readerId: row.reader_id,
    gender: row.gender,
    finishedCount: Number(row.finished_count),
    registeredCount: Number(row.registered_count),
  }));
}

function mapActivityByReader(
  rows: CommunityActivityRpcRow[],
): Map<string, CommunityActivityRow> {
  const mapped = new Map<string, CommunityActivityRow>();

  for (const row of rows) {
    mapped.set(row.reader_id, {
      readerId: row.reader_id,
      registeredCount: Number(row.registered_count),
      finishedCount: Number(row.finished_count),
      currentlyReadingTitle: row.currently_reading_title?.trim() || null,
    });
  }

  return mapped;
}

function groupGenreRows(
  rows: CommunityGenreRow[],
): Map<string, CommunityGenreRow[]> {
  const grouped = new Map<string, CommunityGenreRow[]>();

  for (const row of rows) {
    const current = grouped.get(row.readerId) ?? [];
    current.push(row);
    grouped.set(row.readerId, current);
  }

  return grouped;
}
