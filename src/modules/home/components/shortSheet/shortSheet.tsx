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
import { Label } from "@/components/ui/label";
import { SORT_OPTIONS, useLocalSort } from "./hooks/useLocalSort";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type SortSheetProps = {
  sort: string;
  open: boolean;
  setIsOpen: (open: boolean) => void;
  updateUrlWithSort: (sort: string) => void;
};

export default function SortSheet({
  sort,
  open,
  setIsOpen,
  updateUrlWithSort,
}: SortSheetProps) {
  const { localSort, handleSortChange, resetLocalSort } = useLocalSort(sort);

  // useSyncLocalFilters(sort, open, resetLocalSort);

  const applySort = useCallback(() => {
    updateUrlWithSort(localSort);
    setIsOpen(false);
  }, [localSort, updateUrlWithSort, setIsOpen]);

  const handleClearAll = useCallback(() => {
    resetLocalSort("");
  }, [resetLocalSort]);

  const handleCancel = useCallback(() => {
    resetLocalSort(sort);
    setIsOpen(false);
  }, [sort, resetLocalSort, setIsOpen]);

  return (
    <Sheet open={open} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Ordenar Resultados</SheetTitle>
          <SheetDescription>
            Escolha a forma de ordenação desejada para os resultados exibidos.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 p-3">
          <span className="text-sm font-medium">Critério de Ordenação</span>
          <RadioGroup
            value={localSort}
            onValueChange={handleSortChange}
            className="flex flex-col gap-2"
          >
            {SORT_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <SheetFooter className="flex flex-col gap-2 mt-auto">
          <Button onClick={applySort} className="w-full">
            Aplicar Ordenação
          </Button>
          <Button onClick={handleClearAll} variant="outline" className="w-full">
            Limpar
          </Button>
          <Button onClick={handleCancel} variant="ghost" className="w-full">
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
