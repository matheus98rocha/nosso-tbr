"use client";

import { SearchBar } from "@/components/searchBar/searchBar";
import { useHomeSearchBar } from "../../hooks/useHomeSearchBar";
import { useModal } from "@/hooks/useModal";
import FiltersSheet from "@/modules/home/components/filtersSheet/filters";

export function HomeSearchBar() {
  const {
    searchQuery,
    inputValue,
    handleInputBlur,
    handleSearchButtonClick,
    handleOnPressEnter,
    handleInputChange,
    handleSelectSuggestion,
    inputRef,
    filters,
    updateUrlWithFilters,
    groupedResults,
    isLoadingSuggestions,
    shouldSearch,
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
        inputValue={inputValue}
        onBlur={handleInputBlur}
        onButtonClick={handleSearchButtonClick}
        onKeyDown={handleOnPressEnter}
        onChange={handleInputChange}
        onSelectSuggestion={handleSelectSuggestion}
        groupedResults={groupedResults}
        isLoadingSuggestions={isLoadingSuggestions}
        shouldSearch={shouldSearch}
      />
    </>
  );
}
