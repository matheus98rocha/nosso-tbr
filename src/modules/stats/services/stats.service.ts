import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

import type { Database } from "../../../../database.types";
import { StatsMapper } from "./mappers/stats.mapper";
import {
  CollaborationStatsDomain,
  ReadingLeaderboardEntryDomain,
  StatsDomain,
} from "../types/stats.types";

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

    return (data ?? []).map(StatsMapper.toLeaderboardBase);
  }
}
