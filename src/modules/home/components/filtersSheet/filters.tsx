import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
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

export type FiltersOptions = {
  readers?: string[];
  status?: string;
  gender?: string;
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

  const handleFilterChange = (key: keyof FiltersOptions, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]:
        value === "all"
          ? key === "readers"
            ? []
            : undefined
          : key === "readers"
          ? value.split(",")
          : key === "gender"
          ? value
          : value,
    }));
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

        <div className="flex flex-col gap-6 p-3">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Leitores</span>
            <Select
              onValueChange={(value) => handleFilterChange("readers", value)}
              value={
                localFilters.readers?.length === 0
                  ? "all"
                  : localFilters.readers?.join(",")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione os leitores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Matheus">Matheus</SelectItem>
                <SelectItem value="Fabi">Fabi</SelectItem>
                <SelectItem value="Barbara">Barbara</SelectItem>
                <SelectItem value="Matheus,Fabi">Matheus e Fabi</SelectItem>
                <SelectItem value="Matheus,Barbara">
                  Matheus e Barbara
                </SelectItem>
                <SelectItem value="Fabi,Barbara">Fabi e Barbara</SelectItem>
                <SelectItem value="Matheus,Fabi,Barbara">
                  Fabi, Barbara e Matheus
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-3">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Status</span>
            <Select
              onValueChange={(value) => handleFilterChange("status", value)}
              value={
                localFilters.status === undefined ? "all" : localFilters.status
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtro por Status do livro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="reading">Já iniciei a leitura</SelectItem>
                <SelectItem value="finished">Terminei a Leitura</SelectItem>
                <SelectItem value="not_started">
                  Vou iniciar a leitura
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-3">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Gênero</span>
            <Select
              onValueChange={(value) => handleFilterChange("gender", value)}
              value={
                localFilters.gender === undefined ? "all" : localFilters.gender
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtro por Status do livro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {genders.map((gender) => (
                  <SelectItem key={gender.value} value={gender.value}>
                    {gender.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
