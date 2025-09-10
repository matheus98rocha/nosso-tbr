import { BookPersistence } from "@/types/books.types";
import {
  BookshelvesDomain,
  BookshelvesPersistence,
} from "../../types/bookshelves.types";
import { BookMapper } from "@/services/books/books.mapper";

export class BookshelfMapper {
  static toDomain(data: BookshelvesPersistence): BookshelvesDomain {
    return {
      shelfName: data[0]?.shelf?.[0]?.name ?? "",
      books: data.map((row) => {
        return BookMapper.toDomain(row.book[0] as BookPersistence);
      }),
    };
  }
}
