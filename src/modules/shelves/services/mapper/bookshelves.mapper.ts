import {
  BookshelfCreateValidator,
  BookshelfDomain,
  BookshelfPersistence,
} from "../../types/bookshelves.types";

export class BookshelfMapper {
  static toDomain(persistence: BookshelfPersistence): BookshelfDomain {
    return {
      id: persistence.id,
      name: persistence.name,
      createdAt: persistence.created_at,
      books: persistence.custom_shelf_books.map((book) => ({
        id: book.book.id,
        imageUrl: book.book.image_url,
      })),
    };
  }

  static toPersistence(domain: BookshelfDomain): BookshelfCreateValidator {
    return {
      name: domain.name,
    };
  }
}
