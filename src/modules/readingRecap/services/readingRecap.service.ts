import { INITIAL_FILTERS } from "@/constants/keys";
import { BookService } from "@/services/books/books.service";
import type { BookDomain } from "@/types/books.types";
import type { FiltersOptions } from "@/types/filters";

import type { RecapBook } from "../types";
import { mapBooksToRecapBooks } from "../utils";

const RECAP_PAGE_SIZE = 100;

const FINISHED_FILTERS: FiltersOptions = {
  ...INITIAL_FILTERS,
  status: ["finished"],
};

export class ReadingRecapService {
  constructor(private readonly bookService: BookService = new BookService()) {}

  async getFinishedBooks(userId: string): Promise<RecapBook[]> {
    const books: BookDomain[] = [];
    let page = 0;
    let total = Number.POSITIVE_INFINITY;

    while (books.length < total) {
      const response = await this.bookService.getAll({
        relationshipUserValues: [userId],
        filters: FINISHED_FILTERS,
        page,
        pageSize: RECAP_PAGE_SIZE,
      });

      total = response.total;
      books.push(...response.data);

      if (response.data.length === 0) break;
      if (response.data.length < RECAP_PAGE_SIZE) break;
      page += 1;
    }

    return mapBooksToRecapBooks(books);
  }
}

export default ReadingRecapService;
