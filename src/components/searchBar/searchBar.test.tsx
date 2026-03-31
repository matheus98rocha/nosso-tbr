import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "./searchBar";
import { InputWithButtonRef } from "@/components/inputWithButton";

describe("SearchBar", () => {
  it("fecha o dropdown ao clicar em uma sugestão", () => {
    const onSelectSuggestion = vi.fn();

    render(
      <SearchBar
        refInput={createRef<InputWithButtonRef>()}
        searchQuery=""
        inputValue="hob"
        groupedResults={{
          books: [{ id: "1", label: "O Hobbit", type: "book", score: 2 }],
          authors: [],
        }}
        onSelectSuggestion={onSelectSuggestion}
        shouldSearch
      />,
    );

    const input = screen.getByPlaceholderText(
      "Pesquise por título do livro ou nome do autor",
    );

    fireEvent.focus(input);

    const suggestion = screen.getByRole("button", { name: "O Hobbit" });
    fireEvent.click(suggestion);

    expect(onSelectSuggestion).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "O Hobbit" })).not.toBeInTheDocument();
  });
});
