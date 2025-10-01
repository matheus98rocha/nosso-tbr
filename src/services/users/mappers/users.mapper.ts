import { UserDomain, UserPersistence } from "../types/users.types";

export class UsersMapper {
  static toDomain(persistence: UserDomain): UserPersistence {
    return {
      id: persistence.id,
      display_name: persistence.display_name,
    };
  }
}
