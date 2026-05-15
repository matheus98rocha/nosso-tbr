import { genders } from "@/constants/genders";
import { FiltersOptions } from "@/types/filters";
import { useCallback, useState } from "react";

export type FiltersProps = {
  filters: FiltersOptions;
  open: boolean;
  setIsOpen: (open: boolean) => void;
  updateUrlWithFilters: (filters: FiltersOptions, search?: string) => void;
  searchQuery: string;
  readerOptions: { label: string; value: string }[];
};

export const STATUS_OPTIONS = [
  { label: "Já iniciei a leitura", value: "reading" },
  { label: "Terminei a Leitura", value: "finished" },
  { label: "Vou iniciar a leitura", value: "planned" }, // Mapeado para a nova lógica da service
  { label: "Não iniciado", value: "not_started" },
];

export const GENDER_OPTIONS = genders.map(
  (gender: { label: string; value: string }) => ({
    label: gender.label,
    value: gender.value,
  }),
);

export const useLocalFilters = (initialFilters: FiltersOptions) => {
  const [localFilters, setLocalFilters] =
    useState<FiltersOptions>(initialFilters);

  type FiltersValue<K extends keyof FiltersOptions> = FiltersOptions[K];

  const handleFilterChange = useCallback(
    <K extends keyof FiltersOptions>(key: K, value: FiltersValue<K>) => {
      setLocalFilters((prev) => {
        if (Array.isArray(value)) {
          return {
            ...prev,
            [key]: value.filter(Boolean),
          };
        }

        return {
          ...prev,
          [key]: value,
        };
      });
    },
    [],
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
