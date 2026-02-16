import { AuthorDomain, AuthorPersistence } from "../../types";

export class AuthorMapper {
  static toDomain(persistence: AuthorPersistence): AuthorDomain {
    return {
      name: persistence.name,
      created_at: persistence.created_at,
    };
  }

  static toPersistence(domain: AuthorDomain, id: string): AuthorPersistence {
    return {
      id,
      name: domain.name,
      created_at: domain.created_at,
    };
  }

  static toDomainList(persistenceList: AuthorPersistence[]): AuthorDomain[] {
    return persistenceList.map(AuthorMapper.toDomain);
  }
}
