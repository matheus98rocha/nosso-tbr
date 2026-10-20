import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../../database.types";

type BookAuthorsClient = Pick<SupabaseClient<Database>, "from">;

export async function syncBookAuthors(
  supabase: BookAuthorsClient,
  bookId: string,
  authorIds: string[],
): Promise<{ error: string | null }> {
  const uniqueIds = [...new Set(authorIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { error: "É necessário ao menos um autor" };
  }

  const { error: deleteError } = await supabase
    .from("book_authors")
    .delete()
    .eq("book_id", bookId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const { error: insertError } = await supabase.from("book_authors").insert(
    uniqueIds.map((author_id) => ({
      book_id: bookId,
      author_id,
    })),
  );

  if (insertError) {
    return { error: insertError.message };
  }

  return { error: null };
}
