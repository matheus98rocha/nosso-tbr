import { BookPersistence } from "@/types/books.types";
import {
  BookshelvesDomain,
  BookshelvesPersistence,
} from "../../types/bookshelves.types";
import { BookMapper } from "@/modules/home/services/mappers/books.mappers";

export class BookshelfMapper {
  static toDomain(data: BookshelvesPersistence): BookshelvesDomain {
    return {
      shelfName: data[0]?.shelf?.[0]?.name ?? "",
      books: data.map((row) => {
        console.log("->", row);
        return BookMapper.toDomain(row.book[0] as BookPersistence);
      }),
    };
  }
}
