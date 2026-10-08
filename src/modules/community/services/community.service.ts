import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { UserSocialService } from "@/services/userSocial/userSocial.service";
import type { Database } from "@/types/supabase";

import type {
  CommunityActivityRow,
  CommunityGenreRow,
  CommunityMember,
  CommunityMemberSuggestion,
  CommunityMembersPage,
  CommunitySnapshot,
  CommunityView,
} from "../types/community.types";
import {
  COMMUNITY_SUGGESTION_LIMIT,
  resolveCommunityMemberIds,
  toCommunityNamePattern,
} from "../utils/communityDirectoryQuery";
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
        .map((row) =>
          mapCommunityMember(row, {
            followingSet,
            followerSet,
            genresByReader,
            activityByReader,
          }),
        );

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

  async getMembersPage(input: {
    selfId: string;
    view: CommunityView;
    search: string;
    page: number;
    pageSize: number;
  }): Promise<CommunityMembersPage> {
    try {
      const [followingIds, followerIds] = await Promise.all([
        this.userSocial.getFollowingIds(),
        this.userSocial.getFollowerIds(),
      ]);
      const directoryIds = resolveCommunityMemberIds(
        input.view,
        followingIds,
        followerIds,
      );

      if (directoryIds && directoryIds.length === 0) {
        return { members: [], total: 0 };
      }

      let usersQuery = this.supabase
        .from("users")
        .select("id, display_name, avatar_seed", { count: "exact" })
        .neq("id", input.selfId)
        .order("display_name", { ascending: true });

      if (directoryIds) {
        usersQuery = usersQuery.in("id", [...directoryIds]);
      }

      const namePattern = toCommunityNamePattern(input.search);

      if (namePattern) {
        usersQuery = usersQuery.ilike("display_name", namePattern);
      }

      const from = input.page * input.pageSize;
      const to = from + input.pageSize - 1;
      const [usersResult, genresResult, activityResult] = await Promise.all([
        usersQuery.range(from, to),
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

      const genresByReader = groupGenreRows(
        mapGenreRows(genresResult.data ?? []),
      );
      const activityByReader = mapActivityByReader(activityResult.data ?? []);
      const followingSet = new Set(followingIds);
      const followerSet = new Set(followerIds);

      return {
        members: (usersResult.data ?? [])
          .filter((row) => row.id !== input.selfId)
          .map((row) =>
            mapCommunityMember(row, {
              followingSet,
              followerSet,
              genresByReader,
              activityByReader,
            }),
          ),
        total: usersResult.count ?? 0,
      };
    } catch (error) {
      const normalized = ErrorHandler.normalize(error, {
        service: "CommunityService",
        method: "getMembersPage",
      });
      ErrorHandler.log(normalized);
      throw normalized;
    }
  }

  async searchSuggestions(
    selfId: string,
    term: string,
  ): Promise<CommunityMemberSuggestion[]> {
    try {
      const pattern = toCommunityNamePattern(term);

      if (!pattern) {
        return [];
      }

      const { data, error } = await this.supabase
        .from("users")
        .select("id, display_name")
        .neq("id", selfId)
        .ilike("display_name", pattern)
        .order("display_name", { ascending: true })
        .limit(COMMUNITY_SUGGESTION_LIMIT);

      if (error) {
        throw new RepositoryError(
          "Failed to search community readers",
          undefined,
          undefined,
          error,
        );
      }

      return (data ?? [])
        .filter((row) => row.id !== selfId)
        .map((row) => ({
          id: row.id,
          displayName: resolveCommunityDisplayName(row.display_name),
        }));
    } catch (error) {
      const normalized = ErrorHandler.normalize(error, {
        service: "CommunityService",
        method: "searchSuggestions",
      });
      ErrorHandler.log(normalized);
      throw normalized;
    }
  }
}

type CommunityUserRow = {
  id: string;
  display_name: string | null;
  avatar_seed?: string | null;
};

function mapCommunityMember(
  row: CommunityUserRow,
  context: {
    followingSet: Set<string>;
    followerSet: Set<string>;
    genresByReader: Map<string, CommunityGenreRow[]>;
    activityByReader: Map<string, CommunityActivityRow>;
  },
): CommunityMember {
  const genreRows = context.genresByReader.get(row.id) ?? [];
  const activity = context.activityByReader.get(row.id);

  return {
    id: row.id,
    displayName: resolveCommunityDisplayName(row.display_name),
    avatarSeed: row.avatar_seed ?? null,
    isFollowing: context.followingSet.has(row.id),
    isFollower: context.followerSet.has(row.id),
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
