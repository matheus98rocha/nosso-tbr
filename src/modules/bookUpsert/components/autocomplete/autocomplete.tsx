"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
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

import type {
  AutocompleteItem,
  AutocompleteProps,
} from "./autocomplete.types";

export type { AutocompleteItem, AutocompleteProps };

export default function AutocompleteInput({
  items,
  value,
  initialLabel,
  initialLabels,
  isLoading,
  onValueChange,
  onValuesChange,
  onSearch,
  onClear,
  onAddNew,
  placeholder = "Selecionar...",
  emptyMessage = "Nenhum resultado encontrado.",
  className,
  multiple = false,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);

  const selectedIds = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value.map(String) : [];
    }
    if (value === undefined || value === null || value === "") return [];
    return [String(value)];
  }, [multiple, value]);

  const selectedItems = React.useMemo(() => {
    return selectedIds.map((id) => {
      const found = items.find((item) => String(item.id) === id);
      if (found) return found;
      const labelFromInitial =
        multiple && initialLabels?.[id]
          ? initialLabels[id]
          : !multiple && initialLabel
            ? initialLabel
            : id;
      return { id, name: labelFromInitial };
    });
  }, [selectedIds, items, multiple, initialLabel, initialLabels]);

  const displayLabel = React.useMemo(() => {
    if (multiple) {
      if (selectedItems.length === 0) return placeholder;
      if (selectedItems.length === 1) return selectedItems[0].name;
      return `${selectedItems.length} autores selecionados`;
    }
    if (selectedItems.length === 0) return placeholder;
    return selectedItems[0].name;
  }, [multiple, selectedItems, placeholder]);

  const toggleId = React.useCallback(
    (id: string) => {
      if (multiple) {
        const next = selectedIds.includes(id)
          ? selectedIds.filter((current) => current !== id)
          : [...selectedIds, id];
        onValuesChange?.(next);
        return;
      }
      onValueChange?.(id);
      setOpen(false);
    },
    [multiple, selectedIds, onValuesChange, onValueChange],
  );

  const removeId = React.useCallback(
    (id: string) => {
      if (multiple) {
        onValuesChange?.(selectedIds.filter((current) => current !== id));
        return;
      }
      onValueChange?.("");
      onSearch?.("");
    },
    [multiple, selectedIds, onValuesChange, onValueChange, onSearch],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative w-full">
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between font-normal pr-8",
                selectedIds.length === 0 && "text-muted-foreground",
              )}
            >
              <span className="truncate">{displayLabel}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          {selectedIds.length > 0 && !multiple && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onClear) {
                  onClear();
                } else {
                  removeId(selectedIds[0]);
                }
              }}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>

        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
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
                    {items.map((item) => {
                      const selected = selectedIds.includes(String(item.id));
                      return (
                        <CommandItem
                          key={item.id}
                          value={item.name}
                          onSelect={() => toggleId(String(item.id))}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selected ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {item.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {multiple && selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <span
              key={String(item.id)}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-200 bg-white/80 px-2.5 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-200"
            >
              <span className="truncate">{item.name}</span>
              <button
                type="button"
                aria-label={`Remover ${item.name}`}
                onClick={() => removeId(String(item.id))}
                className="rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
