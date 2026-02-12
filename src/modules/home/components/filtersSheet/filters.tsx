import { useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/multSelect/multiSelect";

import { useSyncLocalFilters } from "./hooks/useSyncLocalFilters";
import {
  FiltersProps,
  GENDER_OPTIONS,
  READER_OPTIONS,
  STATUS_OPTIONS,
  useLocalFilters,
} from "./hooks/useFiltersSheet";
import { usePathname } from "next/navigation";

export default function FiltersSheet({
  filters,
  open,
  setIsOpen,
  updateUrlWithFilters,
  searchQuery,
}: FiltersProps) {
  const pathname = usePathname();
  const { localFilters, handleFilterChange, resetLocalFilters } =
    useLocalFilters(filters);

  useSyncLocalFilters(filters, open, resetLocalFilters);

  const applyFilters = useCallback(() => {
    updateUrlWithFilters(localFilters, searchQuery);
    setIsOpen(false);
  }, [localFilters, searchQuery, updateUrlWithFilters, setIsOpen]);

  const handleCancel = useCallback(() => {
    const cleared = { readers: [], gender: [], status: [] };
    setIsOpen(false);
    updateUrlWithFilters(cleared, "");
    resetLocalFilters(cleared);
  }, [setIsOpen, updateUrlWithFilters, resetLocalFilters]);

  const handleClearAll = useCallback(() => {
    const cleared = { readers: [], gender: [], status: [] };
    resetLocalFilters(cleared);
  }, [resetLocalFilters]);

  return (
    <Sheet open={open} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Redefinir Resultado</SheetTitle>
          <SheetDescription>
            Selecione os filtros e ordenações desejadas para redefinir o
            resultado da pesquisa.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 p-3">
          {pathname === "/" && (
            <FilterSection
              title="Leitores"
              options={READER_OPTIONS}
              selected={localFilters.readers}
              onChange={(values) => handleFilterChange("readers", values)}
              placeholder="Selecione os leitores"
            />
          )}
          <FilterSection
            title="Status"
            options={STATUS_OPTIONS}
            selected={localFilters.status}
            onChange={(values) => handleFilterChange("status", values)}
            placeholder="Selecione os status"
          />

          <FilterSection
            title="Gênero"
            options={GENDER_OPTIONS}
            selected={localFilters.gender}
            onChange={(values) => handleFilterChange("gender", values)}
            placeholder="Selecione os gêneros"
          />
        </div>

        <SheetFooter className="flex flex-col gap-2 mt-auto">
          <Button onClick={applyFilters} className="w-full">
            Aplicar Filtros
          </Button>
          <Button onClick={handleClearAll} variant="outline" className="w-full">
            Limpar Tudo
          </Button>
          <Button onClick={handleCancel} variant="ghost" className="w-full">
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const FilterSection = ({
  title,
  options,
  selected,
  onChange,
  placeholder,
}: {
  title: string;
  options: Array<{ label: string; value: string }>;
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-medium">{title}</span>
    <MultiSelect
      options={options}
      selected={selected}
      onChange={onChange}
      placeholder={placeholder}
    />
  </div>
);
