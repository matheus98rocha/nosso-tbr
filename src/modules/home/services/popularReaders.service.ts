import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import type { Database } from "@/types/supabase";

import type {
  PopularReader,
  PopularReaderRpcRow,
} from "../types/popularReaders.types";
import { POPULAR_READERS_LIMIT } from "../types/popularReaders.types";
import {
  comparePopularReaders,
  mapPopularReaderRow,
} from "../utils/mapPopularReader";

export class PopularReadersService {
  private readonly supabase: SupabaseClient<Database>;

  constructor(client?: SupabaseClient<Database>) {
    this.supabase = (client ?? createClient()) as SupabaseClient<Database>;
  }

  async list(limit: number = POPULAR_READERS_LIMIT): Promise<PopularReader[]> {
    try {
      const clamped = Math.min(Math.max(limit, 1), 24);
      const { data, error } = await this.supabase.rpc(
        "get_popular_readers_for_home",
        { p_limit: clamped },
      );

      if (error) {
        throw new RepositoryError(
          "Failed to load popular readers",
          undefined,
          undefined,
          error,
        );
      }

      return ((data ?? []) as PopularReaderRpcRow[])
        .map(mapPopularReaderRow)
        .sort(comparePopularReaders);
    } catch (error) {
      const normalized = ErrorHandler.normalize(error, {
        service: "PopularReadersService",
        method: "list",
      });
      ErrorHandler.log(normalized);
      throw normalized;
    }
  }
}
