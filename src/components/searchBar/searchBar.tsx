import { Button } from "@/components/ui/button";
import { Sliders } from "lucide-react";
import {
  InputWithButton,
  InputWithButtonRef,
} from "@/components/inputWithButton/inputWithButton";

type SearchBarProps = {
  refInput: React.RefObject<InputWithButtonRef | null>;
  searchQuery: string;
  onButtonClick?: (value: string) => void;
  onBlur?: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onOpenFilters: () => void;
};

export function SearchBar({
  refInput,
  searchQuery,
  onBlur,
  onButtonClick,
  onKeyDown,
  onOpenFilters,
}: SearchBarProps) {
  return (
    <div className="grid w-full mx-auto grid-cols-[1fr_auto] gap-2 items-center">
      <InputWithButton
        ref={refInput}
        defaultValue={searchQuery}
        onBlur={onBlur}
        onButtonClick={onButtonClick}
        onKeyDown={onKeyDown}
        placeholder="Pesquise por título do livro ou nome do autor"
      />

      <Button
        variant="ghost"
        onClick={onOpenFilters}
        className="border border-gray-300 hover:bg-gray-100 flex items-center gap-1"
        aria-label="Filters"
      >
        <Sliders size={16} />
        Filtros
      </Button>
    </div>
  );
}
