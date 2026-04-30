import { useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/multSelect/multiSelect";

import {
  areFiltersOptionsEqual,
  useSyncLocalStateOnClose,
} from "../../hooks/useSyncLocalStateOnClose";
import {
  FiltersProps,
  GENDER_OPTIONS,
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
  readerOptions,
}: FiltersProps) {
  const pathname = usePathname();
  const { localFilters, handleFilterChange, resetLocalFilters } =
    useLocalFilters(filters);

  useSyncLocalStateOnClose({
    externalState: filters,
    isOpen: open,
    syncLocalState: resetLocalFilters,
    areEqual: areFiltersOptionsEqual,
  });

  const applyFilters = useCallback(() => {
    updateUrlWithFilters(localFilters, searchQuery);
    setIsOpen(false);
  }, [localFilters, searchQuery, updateUrlWithFilters, setIsOpen]);

  const handleCancel = useCallback(() => {
    resetLocalFilters(filters);
    setIsOpen(false);
  }, [filters, setIsOpen, resetLocalFilters]);

  const handleClearAll = useCallback(() => {
    const cleared = { ...localFilters, readers: [], gender: [], status: [], isReread: undefined };
    resetLocalFilters(cleared);
  }, [localFilters, resetLocalFilters]);

  return (
    <Sheet open={open} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="w-[300px] sm:w-[400px] flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>Redefinir Resultado</SheetTitle>
          <SheetDescription>
            Selecione os filtros e ordenações desejadas para redefinir o
            resultado da pesquisa.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-3 overflow-y-auto mt-4">
          {pathname === "/" &&
            !(localFilters.view === "todos" && !localFilters.myBooks) && (
              <FilterSection
                title="Leitores"
                options={readerOptions}
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

          <div className="flex items-center gap-3 min-h-[44px]">
            <Switch
              id="filter-reread"
              checked={localFilters.isReread ?? false}
              onCheckedChange={(checked) =>
                handleFilterChange("isReread", checked || false)
              }
            />
            <Label htmlFor="filter-reread" className="text-sm font-semibold text-foreground/80">
              Apenas releituras
            </Label>
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-2 mt-auto pt-4 border-t">
          <Button onClick={applyFilters} className="w-full">
            Aplicar Filtros
          </Button>
          <Button onClick={handleClearAll} variant="outline" className="w-full">
            Limpar Tudo
          </Button>
          <Button
            onClick={handleCancel}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
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
    <span className="text-sm font-semibold text-foreground/80">{title}</span>
    <MultiSelect
      options={options}
      selected={selected}
      onChange={onChange}
      placeholder={placeholder}
    />
  </div>
);
