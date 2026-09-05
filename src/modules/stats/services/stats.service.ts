import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

import type { Database } from "../../../../database.types";
import { StatsMapper } from "./mappers/stats.mapper";
import {
  CollaborationStatsDomain,
  ReadingLeaderboardEntryDomain,
  StatsDomain,
} from "../types/stats.types";

async function getMutualFollowPeerIds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const [{ data: following }, { data: followers }] = await Promise.all([
    supabase
      .from("user_followers")
      .select("following_id")
      .eq("follower_id", userId),
    supabase
      .from("user_followers")
      .select("follower_id")
      .eq("following_id", userId),
  ]);

  const followingIds = new Set(
    (following ?? []).map((row) => row.following_id as string),
  );
  const followerIds = new Set(
    (followers ?? []).map((row) => row.follower_id as string),
  );

  return [...followingIds].filter((id) => followerIds.has(id));
}

export class StatsService {
  private readonly supabase: SupabaseClient<Database>;

  constructor(client?: SupabaseClient<Database>) {
    this.supabase = client ?? createClient();
  }

  async getByReader(reader: string): Promise<StatsDomain[]> {
    const { data, error } = await this.supabase.rpc(
      "get_reading_stats_by_reader",
      {
        reader_input: reader,
      },
    );

    if (error) {
      console.error("Supabase error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    return data?.map(StatsMapper.toDomain) || [];
  }

  async getCollaborationStats(
    reader: string
  ): Promise<CollaborationStatsDomain[]> {
    const { data, error } = await this.supabase.rpc(
      "get_reader_collaboration_stats",
      {
        reader_input: reader,
      },
    );

    if (error) {
      console.error("Supabase error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    return data?.map(StatsMapper.toCollaborationDomain) || [];
  }

  async getReadingLeaderboard(
    year?: number | null
  ): Promise<Omit<ReadingLeaderboardEntryDomain, "rank">[]> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const mutualPeerIds = await getMutualFollowPeerIds(
      this.supabase,
      user.id,
    );

    if (mutualPeerIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase.rpc("get_reading_leaderboard", {
      year_input: year ?? undefined,
    });

    if (error) {
      console.error("Supabase error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    const allowedIds = new Set([user.id, ...mutualPeerIds]);

    return (data ?? [])
      .filter((row) => allowedIds.has(row.reader_id))
      .map(StatsMapper.toLeaderboardBase);
  }
}
