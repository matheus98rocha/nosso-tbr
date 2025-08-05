import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { genders } from "../../utils/genderBook";

import { MultiSelect } from "@/components/multSelect/multiSelect";

export type FiltersOptions = {
  readers?: string[];
  status?: string[];
  gender?: string[];
};

export type FiltersProps = {
  filters: FiltersOptions;
  setFilters: React.Dispatch<React.SetStateAction<FiltersOptions>>;
  open: boolean;
  setIsOpen: (open: boolean) => void;
};

export default function FiltersSheet({
  filters,
  setFilters,
  open,
  setIsOpen,
}: FiltersProps) {
  const [localFilters, setLocalFilters] = useState<FiltersOptions>(filters);

  const handleFilterChange = (
    key: keyof FiltersOptions,
    value: string | string[]
  ) => {
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
  };

  const applyFilters = () => {
    setFilters(localFilters);
    setIsOpen(false);
  };

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
          <span className="text-sm font-medium">Leitores</span>
          <MultiSelect
            options={["Matheus", "Fabi", "Barbara"].map((name) => ({
              label: name,
              value: name,
            }))}
            selected={localFilters.readers || []}
            onChange={(values) => handleFilterChange("readers", values)}
            placeholder="Selecione os leitores"
          />
        </div>

        <div className="flex flex-col gap-2 p-3">
          <span className="text-sm font-medium">Status</span>
          <MultiSelect
            options={[
              { label: "Já iniciei a leitura", value: "reading" },
              { label: "Terminei a Leitura", value: "finished" },
              { label: "Vou iniciar a leitura", value: "not_started" },
            ]}
            selected={localFilters.status || []}
            onChange={(values) => handleFilterChange("status", values)}
            placeholder="Selecione os status"
          />
        </div>

        <div className="flex flex-col gap-2 p-3">
          <span className="text-sm font-medium">Gênero</span>
          <MultiSelect
            options={genders.map((gender) => ({
              label: gender.label,
              value: gender.value,
            }))}
            selected={localFilters.gender || []}
            onChange={(values) => handleFilterChange("gender", values)}
            placeholder="Selecione os gêneros"
          />
        </div>

        <SheetFooter className="mt-auto">
          <Button onClick={applyFilters} className="w-full">
            Aplicar Filtros
          </Button>
          <Button
            onClick={() => {
              setIsOpen(false);
              setFilters({
                readers: [],
              });
              setLocalFilters({ readers: [] });
            }}
            variant="outline"
            className="w-full mt-2"
          >
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
