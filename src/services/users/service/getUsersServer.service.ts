import { createClient } from "@/lib/supabase/server";

import { UsersMapper } from "../mappers/users.mapper";
import { UserDomain } from "../types/users.types";

export async function getUsersServer(): Promise<UserDomain[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, display_name")
    .order("display_name");

  if (error) {
    throw new Error(error.message);
  }

  return data?.map(UsersMapper.toDomain) ?? [];
}
