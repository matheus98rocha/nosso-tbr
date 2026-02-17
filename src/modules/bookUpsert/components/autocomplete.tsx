"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Loader2, X } from "lucide-react"; // Importe o X
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AutocompleteItem {
  id: string | number;
  name: string;
}

interface AutocompleteProps {
  items: AutocompleteItem[];
  value: string | number;
  isLoading?: boolean;
  onValueChange?: (currentValue: string) => void;
  onSearch?: (search: string) => void;
  onClear?: () => void; // Nova prop para limpar
  onAddNew?: () => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export default function AutocompleteInput({
  items,
  value,
  isLoading,
  onValueChange,
  onSearch,
  onClear,
  onAddNew,
  placeholder = "Selecionar...",
  emptyMessage = "Nenhum resultado encontrado.",
  className,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative w-full", className)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal pr-8", // pr-8 para não sobrepor o X
              !value && "text-muted-foreground",
            )}
          >
            <span className="truncate">
              {value
                ? items.find((item) => String(item.id) === String(value))?.name
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        {/* Botão de Limpar (X) */}
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Evita abrir o popover ao clicar no X
              onClear?.();
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={!onSearch}>
          <CommandInput
            placeholder="Digite o nome do autor..."
            onValueChange={onSearch}
          />
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando autores...
              </div>
            ) : (
              <>
                <CommandEmpty className="p-0">
                  <div className="flex flex-col items-center justify-center py-6 text-sm">
                    <p className="mb-4 text-muted-foreground">{emptyMessage}</p>
                    {onAddNew && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          onAddNew();
                          setOpen(false);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar novo autor
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => {
                        onValueChange?.(String(item.id));
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          String(value) === String(item.id)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {item.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
