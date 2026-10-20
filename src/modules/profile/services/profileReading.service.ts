import type { SupabaseClient } from "@supabase/supabase-js";

import { getGenderLabel } from "@/constants/genders";
import { createClient } from "@/lib/supabase/client";
import { pickTopGenre } from "@/modules/community/utils/pickTopGenre";
import type { ProfileReadingShowcase } from "@/modules/profile/types/profileReading.types";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";

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

export class ProfileReadingService {
  private readonly supabase: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.supabase = client ?? createClient();
  }

  async getReadingShowcase(readerId: string): Promise<ProfileReadingShowcase> {
    try {
      const [genresResult, activityResult] = await Promise.all([
        this.supabase.rpc("get_community_reader_genres"),
        this.supabase.rpc("get_community_reader_activity"),
      ]);

      if (genresResult.error) {
        throw new RepositoryError(
          "Failed to load profile genres",
          undefined,
          undefined,
          genresResult.error,
          { readerId },
        );
      }

      if (activityResult.error) {
        throw new RepositoryError(
          "Failed to load profile activity",
          undefined,
          undefined,
          activityResult.error,
          { readerId },
        );
      }

      const genreRows = (
        (genresResult.data ?? []) as CommunityGenreRpcRow[]
      ).filter((row) => row.reader_id === readerId);

      const activityRow = (
        (activityResult.data ?? []) as CommunityActivityRpcRow[]
      ).find((row) => row.reader_id === readerId);

      const mostReadGender = pickTopGenre(
        genreRows.map((row) => ({
          gender: row.gender,
          count: Number(row.finished_count) || 0,
        })),
      );
      const mostRegisteredGender = pickTopGenre(
        genreRows.map((row) => ({
          gender: row.gender,
          count: Number(row.registered_count) || 0,
        })),
      );

      return {
        readerId,
        registeredCount: Number(activityRow?.registered_count) || 0,
        finishedCount: Number(activityRow?.finished_count) || 0,
        currentlyReadingTitle:
          activityRow?.currently_reading_title?.trim() || null,
        mostReadGender,
        mostRegisteredGender,
        mostReadGenderLabel: mostReadGender
          ? String(getGenderLabel(mostReadGender))
          : null,
        mostRegisteredGenderLabel: mostRegisteredGender
          ? String(getGenderLabel(mostRegisteredGender))
          : null,
      };
    } catch (error) {
      const normalized = ErrorHandler.normalize(error, {
        service: "ProfileReadingService",
        method: "getReadingShowcase",
      });
      ErrorHandler.log(normalized);
      throw normalized;
    }
  }
}
