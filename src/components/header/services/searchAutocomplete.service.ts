import { createClient } from "@/lib/supabase/client";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { stripLatinDiacritics } from "@/utils/stripLatinDiacritics";
import { SearchAutocompleteMapper } from "./mappers/searchAutocomplete.mapper";
import { SearchAutocompleteDomain } from "../types/searchAutocomplete.types";

const MIN_SEARCH_LENGTH = 2;
const DEFAULT_LIMIT_PER_TYPE = 5;

export class SearchAutocompleteService {
  private supabase = createClient();

  async search(
    term: string,
    limitPerType = DEFAULT_LIMIT_PER_TYPE,
  ): Promise<SearchAutocompleteDomain[]> {
    const normalizedTerm = term.trim();

    if (normalizedTerm.length < MIN_SEARCH_LENGTH) {
      return [];
    }

    const asciiFoldedTerm = stripLatinDiacritics(normalizedTerm).toLowerCase();

    try {
      const [booksResponse, authorsResponse] = await Promise.all([
        this.supabase
          .from("books")
          .select("id, title")
          .ilike("title_unaccent", `%${asciiFoldedTerm}%`)
          .limit(limitPerType * 2),
        this.supabase
          .from("authors")
          .select("id, name")
          .ilike("name_unaccent", `%${asciiFoldedTerm}%`)
          .limit(limitPerType * 2),
      ]);

      if (booksResponse.error) {
        throw new RepositoryError(
          "Falha ao buscar livros no autocomplete",
          undefined,
          undefined,
          booksResponse.error,
          { term: normalizedTerm },
        );
      }

      if (authorsResponse.error) {
        throw new RepositoryError(
          "Falha ao buscar autores no autocomplete",
          undefined,
          undefined,
          authorsResponse.error,
          { term: normalizedTerm },
        );
      }

      const books = (booksResponse.data ?? []).map((book) =>
        SearchAutocompleteMapper.toDomain(
          { id: book.id, label: book.title, type: "book" },
          normalizedTerm,
        ),
      );

      const authors = (authorsResponse.data ?? []).map((author) =>
        SearchAutocompleteMapper.toDomain(
          { id: author.id, label: author.name, type: "author" },
          normalizedTerm,
        ),
      );

      const sortByRelevance = (a: SearchAutocompleteDomain, b: SearchAutocompleteDomain) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.label.localeCompare(b.label, "pt-BR");
      };

      const uniqueById = <T extends SearchAutocompleteDomain>(items: T[]) =>
        items.filter(
          (item, index, source) =>
            source.findIndex((candidate) => candidate.id === item.id) === index,
        );

      const rankedBooks = uniqueById(books)
        .sort(sortByRelevance)
        .slice(0, limitPerType);
      const rankedAuthors = uniqueById(authors)
        .sort(sortByRelevance)
        .slice(0, limitPerType);

      return [...rankedBooks, ...rankedAuthors];
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "SearchAutocompleteService",
        method: "search",
        term: normalizedTerm,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
}
