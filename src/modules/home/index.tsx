"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { useHome } from "@/modules/home/hooks/useHome";
import { useModal } from "@/hooks/useModal";
import FiltersSheet, {
  FiltersOptions,
} from "./components/filtersSheet/filters";
import { ListGrid } from "../../components/listGrid/listGrid";
import { BookDomain } from "../../types/books.types";
import { BookCard } from "./components/bookCard/bookCard";
import { CreateEditBookshelves } from "../shelves/components/createEditBookshelves/createEditBookshelves";

import { useRouter, useSearchParams } from "next/navigation";
import { genders } from "./utils/genderBook";
import { Sliders } from "lucide-react";
import {
  InputWithButton,
  InputWithButtonRef,
} from "@/components/inputWithButton/inputWithButton";

import { useUserStore } from "@/stores/userStore";
import { formatList } from "./utils/formatList";

const STATUS_DICTIONARY = {
  finished: "Terminei a Leitura",
  reading: "Já iniciei a leitura",
  not_started: "Vou iniciar a leitura",
} as const;

export default function ClientHome() {
  const isLoggingOut = useUserStore((state) => state.isLoggingOut);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FiltersOptions>({
    readers: [],
    gender: [],
    status: [],
  });

  const searchQuery = searchParams.get("search") ?? "";
  const inputRef = useRef<InputWithButtonRef>(null);

  const dialogModal = useModal();
  const filtersSheet = useModal();
  const createShelfDialog = useModal();

  const { allBooks, isFetched, isLoadingAllBooks, isError, isLoadingUser } =
    useHome({
      filters,
      search: searchQuery,
    });

  const updateUrlWithFilters = useCallback(
    (newFilters: FiltersOptions, search?: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (search && search.trim()) {
        params.set("search", search.trim());
      } else {
        params.delete("search");
      }

      if (newFilters.readers.length) {
        params.set(
          "readers",
          newFilters.readers.map(encodeURIComponent).join(",")
        );
      } else {
        params.delete("readers");
      }

      if (newFilters.status.length) {
        params.set(
          "status",
          newFilters.status.map(encodeURIComponent).join(",")
        );
      } else {
        params.delete("status");
      }

      if (newFilters.gender.length) {
        params.set(
          "gender",
          newFilters.gender.map(encodeURIComponent).join(",")
        );
      } else {
        params.delete("gender");
      }

      const qs = params.toString();
      const target = qs ? `?${qs}` : window.location.pathname;
      router.replace(target);
    },
    [router, searchParams]
  );

  useEffect(() => {
    const readers =
      searchParams.get("readers")?.split(",").map(decodeURIComponent) ?? [];
    const status =
      searchParams.get("status")?.split(",").map(decodeURIComponent) ?? [];
    const gender =
      searchParams.get("gender")?.split(",").map(decodeURIComponent) ?? [];

    const next = { readers, status, gender };

    const isSame =
      filters.readers.join(",") === next.readers.join(",") &&
      filters.status.join(",") === next.status.join(",") &&
      filters.gender.join(",") === next.gender.join(",");

    if (!isSame) {
      setFilters(next);
    }
  }, [searchParams, filters]);

  const handleOnPressEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    if (event.key === "Enter" && value.trim() !== "") {
      updateUrlWithFilters(filters, value);
    }
  };

  const handleClearAllFilters = useCallback(() => {
    const cleared = { readers: [], gender: [], status: [] };
    setFilters(cleared);
    updateUrlWithFilters(cleared, "");
    inputRef.current?.clear();
  }, [updateUrlWithFilters]);

  const handleInputBlur = useCallback(
    (value: string) => {
      updateUrlWithFilters(filters, value);
    },
    [filters, updateUrlWithFilters]
  );

  const handleSearchButtonClick = (value: string) =>
    updateUrlWithFilters(filters, value);

  const formattedGenres = useMemo(() => {
    if (!Array.isArray(filters.gender) || filters.gender.length === 0)
      return null;
    const labels = filters.gender.map(
      (value) => genders.find((g) => g.value === value)?.label ?? value
    );
    return formatList(labels);
  }, [filters.gender]);

  const formattedReaders = useMemo(() => {
    return Array.isArray(filters?.readers) && filters.readers.length > 0
      ? formatList(filters.readers)
      : null;
  }, [filters.readers]);

  const formattedStatus = useMemo(() => {
    return Array.isArray(filters?.status) && filters.status.length > 0
      ? formatList(
          filters.status.map(
            (value) =>
              `"${
                STATUS_DICTIONARY[value as keyof typeof STATUS_DICTIONARY] ??
                value
              }"`
          )
        )
      : null;
  }, [filters.status]);

  return (
    <>
      <BookUpsert
        isBookFormOpen={dialogModal.isOpen}
        setIsBookFormOpen={dialogModal.setIsOpen}
      />

      <FiltersSheet
        filters={filters}
        setFilters={setFilters}
        open={filtersSheet.isOpen}
        setIsOpen={filtersSheet.setIsOpen}
        updateUrlWithFilters={updateUrlWithFilters}
        searchQuery={searchQuery}
      />

      <CreateEditBookshelves
        isOpen={createShelfDialog.isOpen}
        handleClose={createShelfDialog.setIsOpen}
      />
      <div className="w-full flex items-center justify-center flex-col gap-4 container">
        <div className="grid w-full mx-auto grid-cols-[1fr_auto] gap-2 items-center">
          <InputWithButton
            ref={inputRef}
            defaultValue={searchQuery}
            onBlur={handleInputBlur}
            onButtonClick={handleSearchButtonClick}
            placeholder="Pesquise por título do livro ou nome do autor"
            onKeyDown={handleOnPressEnter}
          />

          <Button
            variant="ghost"
            onClick={() => filtersSheet.setIsOpen(true)}
            className="border border-gray-300 hover:bg-gray-100 flex items-center gap-1"
            aria-label="Filters"
          >
            <Sliders size={16} />
            Filtros
          </Button>
        </div>
        {!isLoadingAllBooks && (
          <div className="flex items-start justify-center flex-col container">
            <h4 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Resultados
            </h4>

            <p className="leading-7">
              Foram encontrados: <strong>{allBooks?.length || 0} livros</strong>
            </p>
            <div className="flex items-center justify-center gap-4">
              {(formattedGenres ||
                formattedReaders ||
                formattedStatus ||
                searchQuery) && (
                <p className="leading-7 text-muted-foreground mt-2">
                  {searchQuery && (
                    <>
                      Buscando por: <strong>{searchQuery}</strong>
                      {(formattedGenres ||
                        formattedReaders ||
                        formattedStatus) && <br />}
                    </>
                  )}

                  {(formattedGenres || formattedReaders || formattedStatus) && (
                    <>
                      Filtros aplicados:
                      {formattedGenres && ` gênero ${formattedGenres}`}
                      {formattedReaders &&
                        `${
                          formattedGenres ? "," : ""
                        } Leitor(s) ${formattedReaders}`}
                      {formattedStatus &&
                        `${
                          formattedGenres || formattedReaders ? " e" : ""
                        } com status ${formattedStatus}`}
                    </>
                  )}
                </p>
              )}

              {(searchQuery ||
                (Array.isArray(filters.gender) && filters.gender.length > 0) ||
                (Array.isArray(filters.readers) &&
                  filters.readers.length > 0) ||
                (Array.isArray(filters.status) &&
                  filters.status.length > 0)) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    handleClearAllFilters();
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>
        )}

        <ListGrid<BookDomain>
          items={allBooks ?? []}
          isLoading={isLoadingAllBooks || isLoadingUser || isLoggingOut}
          isFetched={isFetched}
          renderItem={(book) => <BookCard key={book.id} book={book} />}
          isError={isError}
        />
      </div>
    </>
  );
}
