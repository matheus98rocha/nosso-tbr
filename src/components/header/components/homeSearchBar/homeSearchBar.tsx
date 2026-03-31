"use client";

import { SearchBar } from "@/components/searchBar";
import { useHomeSearchBar } from "../../hooks/useHomeSearchBar";
import { useModal } from "@/hooks/useModal";
import FiltersSheet from "@/modules/home/components/filtersSheet/filters";
import { useUser } from "@/services/users/hooks/useUsers";
import { useMemo } from "react";

export function HomeSearchBar() {
  const { users } = useUser();
  const readerOptions = useMemo(
    () =>
      users.map((u) => ({
        label: u.display_name,
        value: u.id,
      })),
    [users],
  );
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
        readerOptions={readerOptions}
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
