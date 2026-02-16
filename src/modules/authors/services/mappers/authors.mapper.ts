import { AuthorDomain, AuthorPersistence } from "../../types";

export class AuthorMapper {
  static toDomain(persistence: AuthorPersistence): AuthorDomain {
    return {
      id: persistence.id,
      name: persistence.name,
      createdAt: persistence.created_at,
      totalBooks: persistence.total_books,
    };
  }

  static toPersistence(domain: AuthorDomain, id: string): AuthorPersistence {
    return {
      id,
      name: domain.name,
      created_at: domain.createdAt,
      total_books: domain.totalBooks,
    };
  }

  static toDomainList(persistenceList: AuthorPersistence[]): AuthorDomain[] {
    return persistenceList.map(AuthorMapper.toDomain);
  }
}
