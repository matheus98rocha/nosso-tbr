import {
  BookshelfDomain,
  BookshelfPersistence,
} from "../types/bookshelves.types";

export class BookshelfMapper {
  static toDomain(data: BookshelfPersistence): BookshelfDomain {
    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
    };
  }
}
