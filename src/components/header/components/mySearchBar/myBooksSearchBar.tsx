"use client";

import { SearchBar } from "@/components/searchBar/searchBar";
import { useHomeSearchBar } from "../../hooks/useHomeSearchBar";
import { useModal } from "@/hooks/useModal";
import FiltersSheet from "@/modules/home/components/filtersSheet/filters";

export function MyBooksSearchBar() {
  const {
    searchQuery,
    handleInputBlur,
    handleSearchButtonClick,
    handleOnPressEnter,
    inputRef,
    filters,
    updateUrlWithFilters,
  } = useHomeSearchBar();

  const filtersSheet = useModal();

  return (
    <>
      <FiltersSheet
        filters={filters}
        open={filtersSheet.isOpen}
        setIsOpen={filtersSheet.setIsOpen}
        updateUrlWithFilters={updateUrlWithFilters}
        searchQuery={searchQuery}
      />
      <SearchBar
        refInput={inputRef}
        searchQuery={searchQuery}
        onBlur={handleInputBlur}
        onButtonClick={handleSearchButtonClick}
        onKeyDown={handleOnPressEnter}
        onOpenFilters={() => {
          filtersSheet.setIsOpen(true);
        }}
      />
    </>
  );
}
