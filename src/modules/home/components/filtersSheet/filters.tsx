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
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export type FiltersOptions = {
  readers?: string[];
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

  const handleChange = (value: string) => {
    setLocalFilters({
      readers: value === "all" ? [] : value.split(","),
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

        <div className="flex flex-col gap-6 p-3">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Leitores</span>
            <Select
              onValueChange={handleChange}
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

        <SheetFooter className="mt-auto">
          <Button onClick={applyFilters} className="w-full">
            Aplicar Filtros
          </Button>
          <SheetClose asChild>
            <Button variant="outline" className="w-full mt-2">
              Cancelar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
