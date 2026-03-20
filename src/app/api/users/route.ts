import { createClient } from "@/lib/supabase/server";
import { UsersMapper } from "@/services/users/mappers/users.mapper";
import { NextResponse } from "next/server";

const USERS_TAG = "users";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, display_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = data?.map(UsersMapper.toDomain) ?? [];

  return NextResponse.json(users, {
    headers: {
      "x-nextjs-cache-tags": USERS_TAG,
      "Cache-Control": "no-store",
    },
  });
}
