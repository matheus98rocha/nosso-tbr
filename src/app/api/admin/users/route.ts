import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireAdmin } from "@/app/api/_utils/requireAdmin";
import { NextResponse } from "next/server";

type BookChosenByRow = {
  chosen_by: string | null;
};

function buildBooksCountByUserId(books: BookChosenByRow[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const book of books) {
    const userId = book.chosen_by?.trim();
    if (!userId) continue;
    counts.set(userId, (counts.get(userId) ?? 0) + 1);
  }

  return counts;
}

async function fetchLastSignInByUserId(
  adminClient: ReturnType<typeof createServiceRoleClient>,
): Promise<Map<string, string | null>> {
  const lastSignInByUserId = new Map<string, string | null>();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    for (const authUser of data.users) {
      lastSignInByUserId.set(authUser.id, authUser.last_sign_in_at ?? null);
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return lastSignInByUserId;
}

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  let adminClient;
  try {
    adminClient = createServiceRoleClient();
  } catch {
    return NextResponse.json(
      {
        error:
          "Operação administrativa não configurada. Defina SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const [usersResult, booksResult, lastSignInByUserId] = await Promise.all([
    adminClient
      .from("users")
      .select("id, display_name, email, tier")
      .order("display_name", { ascending: true }),
    adminClient.from("books").select("chosen_by"),
    fetchLastSignInByUserId(adminClient),
  ]);

  if (usersResult.error) {
    return NextResponse.json({ error: usersResult.error.message }, { status: 500 });
  }

  if (booksResult.error) {
    return NextResponse.json({ error: booksResult.error.message }, { status: 500 });
  }

  const booksCountByUserId = buildBooksCountByUserId(booksResult.data ?? []);

  const payload = (usersResult.data ?? []).map((user) => ({
    ...user,
    books_count: booksCountByUserId.get(user.id) ?? 0,
    last_sign_in_at: lastSignInByUserId.get(user.id) ?? null,
  }));

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
