import {
  InputWithButton,
  InputWithButtonRef,
} from "@/components/inputWithButton/inputWithButton";
import { SearchAutocompleteDomain } from "@/components/header/types/searchAutocomplete.types";

type SearchBarProps = {
  refInput: React.RefObject<InputWithButtonRef | null>;
  searchQuery: string;
  inputValue: string;
  onButtonClick?: (value: string) => void;
  onBlur?: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onChange?: (value: string) => void;
  onSelectSuggestion?: (result: SearchAutocompleteDomain) => void;
  groupedResults: {
    books: SearchAutocompleteDomain[];
    authors: SearchAutocompleteDomain[];
  };
  isLoadingSuggestions?: boolean;
  shouldSearch?: boolean;
};

export function SearchBar({
  refInput,
  searchQuery,
  inputValue,
  onBlur,
  onButtonClick,
  onKeyDown,
  onChange,
  onSelectSuggestion,
  groupedResults,
  isLoadingSuggestions,
  shouldSearch,
  // onOpenFilters,
}: SearchBarProps) {
  const hasResults =
    groupedResults.books.length > 0 || groupedResults.authors.length > 0;

  return (
    <div className="grid w-full md:w-[70%] mx-auto grid-cols-[1fr_auto] gap-2 items-center bg-white">
      <div className="relative">
        <InputWithButton
          ref={refInput}
          defaultValue={searchQuery}
          value={inputValue}
          onBlur={onBlur}
          onButtonClick={onButtonClick}
          onKeyDown={onKeyDown}
          onChange={onChange}
          placeholder="Pesquise por título do livro ou nome do autor"
        />
        {shouldSearch && (
          <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-sm">
            {isLoadingSuggestions ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Buscando...</p>
            ) : hasResults ? (
              <div className="max-h-80 overflow-y-auto py-1">
                {groupedResults.books.length > 0 && (
                  <div>
                    <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase">
                      📚 Books
                    </p>
                    {groupedResults.books.map((book) => (
                      <button
                        key={`book-${book.id}`}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onSelectSuggestion?.(book)}
                      >
                        {book.label}
                      </button>
                    ))}
                  </div>
                )}
                {groupedResults.authors.length > 0 && (
                  <div>
                    <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase">
                      ✍️ Authors
                    </p>
                    {groupedResults.authors.map((author) => (
                      <button
                        key={`author-${author.id}`}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onSelectSuggestion?.(author)}
                      >
                        {author.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No results found
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-2">
        {/* <Button
          variant="ghost"
          onClick={onOpenFilters}
          className="border border-gray-300 hover:bg-gray-100 flex items-center gap-1"
          aria-label="Filters"
        >
          <Sliders size={16} />
          Filtros
        </Button> */}

        {/* <Button
          variant="ghost"
          onClick={() => {}}
          className="border border-gray-300 hover:bg-gray-100 flex items-center gap-1"
          aria-label="Sort"
        >
          <ArrowUpDown size={16} />
          Ordenar
        </Button> */}
      </div>
    </div>
  );
}
