import { genders } from "@/modules/home/utils/genderBook";
import { useCallback, useState } from "react";

export type FiltersOptions = {
  readers: string[];
  status: string[];
  gender: string[];
  bookId?: string;
  userId?: string;
};

export type FiltersProps = {
  filters: FiltersOptions;
  open: boolean;
  setIsOpen: (open: boolean) => void;
  updateUrlWithFilters: (filters: FiltersOptions, search?: string) => void;
  searchQuery: string;
};

// Opções pré-definidas para melhor performance
export const READER_OPTIONS = ["Matheus", "Fabi", "Barbara"].map((name) => ({
  label: name,
  value: name,
}));

export const STATUS_OPTIONS = [
  { label: "Já iniciei a leitura", value: "reading" },
  { label: "Terminei a Leitura", value: "finished" },
  { label: "Vou iniciar a leitura", value: "not_started" },
];

export const GENDER_OPTIONS = genders.map(
  (gender: { label: string; value: string }) => ({
    label: gender.label,
    value: gender.value,
  })
);

export const useLocalFilters = (initialFilters: FiltersOptions) => {
  const [localFilters, setLocalFilters] =
    useState<FiltersOptions>(initialFilters);

  const handleFilterChange = useCallback(
    (key: keyof FiltersOptions, value: string | string[]) => {
      setLocalFilters((prev) => {
        if (key === "readers" || key === "status" || key === "gender") {
          const values = Array.isArray(value) ? value : [value];
          return {
            ...prev,
            [key]: values.filter(Boolean),
          };
        }
        return prev;
      });
    },
    []
  );

  const resetLocalFilters = useCallback((newFilters: FiltersOptions) => {
    setLocalFilters(newFilters);
  }, []);

  return {
    localFilters,
    handleFilterChange,
    resetLocalFilters,
  };
};
