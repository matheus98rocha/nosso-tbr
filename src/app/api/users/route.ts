import { createClient } from "@/lib/supabase/server";
import { UsersMapper } from "@/services/users/mappers/users.mapper";
import { NextResponse } from "next/server";

const USERS_TAG = "users";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = data?.map(UsersMapper.toDomain) ?? [];

  return NextResponse.json(users, {
    headers: { "x-nextjs-cache-tags": USERS_TAG },
  });
}
