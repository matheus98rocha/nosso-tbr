import { DirectoryUser, DirectoryUserRow } from "../types/userSocial.types";

export class UserSocialMapper {
  static toDirectoryUser(row: DirectoryUserRow): DirectoryUser {
    return {
      id: row.id,
      displayName: row.display_name,
      email: row.email ?? "",
      joinedAt: null,
    };
  }
}
