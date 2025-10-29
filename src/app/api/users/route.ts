// import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { createClient } from "@/lib/supabase/server";
import { UsersMapper } from "@/services/users/mappers/users.mapper";
// import { UserDomain, UserPersistence } from "../types/users.types";
import { NextResponse } from "next/server";

// export class UsersService {
//   private supabase = createClient();

//   async get(): Promise<UserDomain[]> {
//     try {
//       const { data, error } = await this.supabase.from("users").select("*");

//       if (error) {
//         throw new RepositoryError(
//           "Falha ao buscar usuários",
//           undefined,
//           undefined,
//           error,
//           {}
//         );
//       }

//       if (!data) return [];

//       return data.map((row) => UsersMapper.toDomain(row as UserPersistence));
//     } catch (error) {
//       const normalizedError = ErrorHandler.normalize(error, {
//         service: "QuotesService",
//         method: "getQuotesByBook",
//       });
//       ErrorHandler.log(normalizedError);
//       throw normalizedError;
//     }
//   }
// }

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
