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
};

export function SearchBar({
  refInput,
  searchQuery,
  onBlur,
  onButtonClick,
  onKeyDown,
  // onOpenFilters,
}: SearchBarProps) {
  return (
    <div className="grid w-full md:w-[70%] mx-auto grid-cols-[1fr_auto] gap-2 items-center bg-white">
      <InputWithButton
        ref={refInput}
        defaultValue={searchQuery}
        onBlur={onBlur}
        onButtonClick={onButtonClick}
        onKeyDown={onKeyDown}
        placeholder="Pesquise por título do livro ou nome do autor"
      />
      <div className="flex items-center justify-center gap-2">
        {/* <Button
          variant="ghost"
          onClick={onOpenFilters}
          className="border border-gray-300 hover:bg-gray-100 flex items-center gap-1"
          aria-label="Filters"
        >
          <Sliders size={16} />
          Filtros
        </Button> */}

        {/* <Button
          variant="ghost"
          onClick={() => {}}
          className="border border-gray-300 hover:bg-gray-100 flex items-center gap-1"
          aria-label="Sort"
        >
          <ArrowUpDown size={16} />
          Ordenar
        </Button> */}
      </div>
    </div>
  );
}
