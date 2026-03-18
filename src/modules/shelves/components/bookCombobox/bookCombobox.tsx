import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { BookDomain } from "@/types/books.types";
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

export type BookComboboxProps = {
  books: BookDomain[];
  value: string;
  onChange: (bookId: string) => void;
};

export function BookCombobox({ books, value, onChange }: BookComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedBook = books.find((book) => book.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[44px] cursor-pointer"
        >
          <span className="truncate text-sm">
            {selectedBook ? selectedBook.title : "Selecione um livro..."}
          </span>
          <ChevronsUpDown className="opacity-50 h-4 w-4 shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar livro..." className="h-10" />
          <CommandList>
            <CommandEmpty>Nenhum livro encontrado.</CommandEmpty>
            <CommandGroup>
              {books.map((book) => (
                <CommandItem
                  key={book.id}
                  value={book.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="cursor-pointer min-h-[40px]"
                >
                  <span className="truncate flex-1">{book.title}</span>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === book.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
