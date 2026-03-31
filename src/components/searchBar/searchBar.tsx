"use client";

import { memo } from "react";
import { BookOpen, PenLine } from "lucide-react";
import { InputWithButton } from "@/components";
import { useSearchBar } from "./hooks/useSearchBar";
import type { SearchBarProps } from "./types/searchBar.types";

function SearchBarComponent({
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
}: SearchBarProps) {
  const {
    containerRef,
    showAutocomplete,
    hasResults,
    handleFocusInput,
    handleButtonClick,
    handleSelectBook,
    handleSelectAuthor,
  } = useSearchBar({
    groupedResults,
    shouldSearch,
    onButtonClick,
    onSelectSuggestion,
  });

  return (
    <div className="grid w-full md:w-[70%] mx-auto grid-cols-[1fr_auto] gap-2 items-center bg-white">
      <div className="relative" ref={containerRef}>
        <InputWithButton
          ref={refInput}
          defaultValue={searchQuery}
          value={inputValue}
          onBlur={onBlur}
          onFocus={handleFocusInput}
          onButtonClick={handleButtonClick}
          onKeyDown={onKeyDown}
          onChange={onChange}
          placeholder="Pesquise por título do livro ou nome do autor"
        />
        {showAutocomplete && (
          <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-sm">
            {isLoadingSuggestions ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Buscando...</p>
            ) : hasResults ? (
              <div className="max-h-80 overflow-y-auto py-1">
                {groupedResults.books.length > 0 && (
                  <div>
                    <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Books
                    </p>
                    {groupedResults.books.map((book) => (
                      <button
                        key={`book-${book.id}`}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted min-h-11"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelectBook(book)}
                      >
                        {book.label}
                      </button>
                    ))}
                  </div>
                )}
                {groupedResults.authors.length > 0 && (
                  <div>
                    <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                      <PenLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Authors
                    </p>
                    {groupedResults.authors.map((author) => (
                      <button
                        key={`author-${author.id}`}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted min-h-11"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelectAuthor(author)}
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
      <div className="flex items-center justify-center gap-2" />
    </div>
  );
}

export const SearchBar = memo(SearchBarComponent);
