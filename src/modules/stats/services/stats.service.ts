import { createClient } from "@/lib/supabase/client";
import { StatsMapper } from "./mappers/stats.mapper";
import { StatsDomain, CollaborationStatsDomain } from "../types/stats.types";

export class StatsService {
  private supabase = createClient();

  async getByReader(reader: string): Promise<StatsDomain[]> {
    const { data, error } = await this.supabase
      .rpc("get_reading_stats_by_reader", {
        reader_input: reader,
      })
      .select("*");

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
    const { data, error } = await this.supabase
      .rpc("get_reader_collaboration_stats", {
        reader_input: reader,
      })
      .select("*");

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
}
