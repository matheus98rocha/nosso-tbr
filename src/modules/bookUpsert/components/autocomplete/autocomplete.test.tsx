import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import AutocompleteInput from "./autocomplete";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const FIRST_AUTHOR_ID = "bdb51b7b-bf9a-4346-bf90-3f29c6d69146";

describe("AutocompleteInput multiple mode", () => {
  it("keeps chip labels after selected ids leave the current items list", () => {
    const onValuesChange = vi.fn();
    const firstAuthor = { id: FIRST_AUTHOR_ID, name: "Autor Desconhecido" };
    const secondAuthor = { id: "author-2", name: "Colleen Hoover" };

    const { rerender } = render(
      <AutocompleteInput
        multiple
        items={[firstAuthor]}
        value={[FIRST_AUTHOR_ID]}
        onValuesChange={onValuesChange}
        placeholder="Pesquisar autores..."
      />,
    );

    expect(
      screen.getByRole("button", { name: "Remover Autor Desconhecido" }),
    ).toBeInTheDocument();

    rerender(
      <AutocompleteInput
        multiple
        items={[secondAuthor]}
        value={[FIRST_AUTHOR_ID, "author-2"]}
        onValuesChange={onValuesChange}
        placeholder="Pesquisar autores..."
      />,
    );

    expect(
      screen.getByRole("button", { name: "Remover Autor Desconhecido" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remover Colleen Hoover" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(FIRST_AUTHOR_ID)).not.toBeInTheDocument();
  });

  it("uses initialLabels when selected id is not in items", () => {
    render(
      <AutocompleteInput
        multiple
        items={[{ id: "author-2", name: "Colleen Hoover" }]}
        value={[FIRST_AUTHOR_ID, "author-2"]}
        initialLabels={{
          [FIRST_AUTHOR_ID]: "Autor Desconhecido",
        }}
        onValuesChange={vi.fn()}
        placeholder="Pesquisar autores..."
      />,
    );

    expect(
      screen.getByRole("button", { name: "Remover Autor Desconhecido" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remover Colleen Hoover" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(FIRST_AUTHOR_ID)).not.toBeInTheDocument();
  });

  it("closes the popover after selecting an author in multiple mode", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();

    render(
      <AutocompleteInput
        multiple
        items={[{ id: "author-1", name: "Colleen Hoover" }]}
        value={[]}
        onValuesChange={onValuesChange}
        placeholder="Pesquisar autores..."
      />,
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByPlaceholderText("Digite o nome do autor..."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: /colleen hoover/i }));

    expect(onValuesChange).toHaveBeenCalledWith(["author-1"]);
    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
    expect(
      screen.queryByPlaceholderText("Digite o nome do autor..."),
    ).not.toBeInTheDocument();
  });

  it("still supports single-author selection and closes the popover", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <AutocompleteInput
        items={[{ id: "author-1", name: "Colleen Hoover" }]}
        value=""
        onValueChange={onValueChange}
        placeholder="Pesquisar autores..."
      />,
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: /colleen hoover/i }));

    expect(onValueChange).toHaveBeenCalledWith("author-1");
    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("allows removing a selected chip in multiple mode", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();

    render(
      <AutocompleteInput
        multiple
        items={[{ id: "author-1", name: "Colleen Hoover" }]}
        value={["author-1"]}
        onValuesChange={onValuesChange}
        placeholder="Pesquisar autores..."
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Remover Colleen Hoover" }),
    );

    expect(onValuesChange).toHaveBeenCalledWith([]);
  });
});
