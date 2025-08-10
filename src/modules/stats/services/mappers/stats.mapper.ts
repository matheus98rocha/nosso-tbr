import {
  StatsDomain,
  StatsPersistence,
  CollaborationStatsDomain,
  CollaborationStatsPersistence,
} from "../../types/stats.types";

export class StatsMapper {
  /**
   * Mapeia um objeto de persistência de estatísticas anuais para um objeto de domínio.
   * @param {StatsPersistence} p O objeto de persistência do banco de dados.
   * @returns {StatsDomain} O objeto de domínio.
   */
  static toDomain(p: StatsPersistence): StatsDomain {
    return {
      year: p.year,
      totalBooks: p.total_books,
      mostReadAuthor: p.most_read_author,
      mostReadGenre: p.most_read_genre,
      totalPages: p.total_pages,
      mostProductiveMonth: p.most_productive_month,
      longestBookTitle: p.longest_book_title,
      longestBookPages: p.longest_book_pages,
      avgPagesPerBook: p.avg_pages_per_book,
    };
  }

  /**
   * Mapeia um objeto de persistência de estatísticas de colaboração para um objeto de domínio.
   * @param {CollaborationStatsPersistence} p O objeto de persistência do banco de dados.
   * @returns {CollaborationStatsDomain} O objeto de domínio.
   */
  static toCollaborationDomain(
    p: CollaborationStatsPersistence
  ): CollaborationStatsDomain {
    return {
      readerName: p.reader_name,
      booksRead: p.books_read,
    };
  }
}
