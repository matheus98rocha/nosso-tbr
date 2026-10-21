import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColumnDef } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import { AuthorDomain } from "../../types";
import { DataTable } from "./dataTable";

const columns: ColumnDef<AuthorDomain>[] = [
  { accessorKey: "name", header: "Autor" },
  {
    id: "actions",
    header: "Ações",
    enableSorting: false,
    cell: () => <button type="button">Editar</button>,
  },
];

const pageInCreationOrder: AuthorDomain[] = [
  { id: "1", name: "Zélia", createdAt: "2020-01-01" },
  { id: "2", name: "Ana", createdAt: "2021-01-01" },
];

function renderTable(onSortingChange = vi.fn()) {
  render(
    <DataTable
      columns={columns}
      data={pageInCreationOrder}
      searchValue=""
      onChangeSearch={vi.fn()}
      onClickNewAuthor={vi.fn()}
      onClearSearch={vi.fn()}
      sorting={[{ id: "name", desc: false }]}
      onSortingChange={onSortingChange}
    />,
  );
  return onSortingChange;
}

describe("DataTable", () => {
  it("mantém a ordem recebida mesmo com ordenação por nome", () => {
    renderTable();

    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.textContent);

    expect(names[0]).toContain("Zélia");
    expect(names[1]).toContain("Ana");
    expect(screen.getByRole("columnheader", { name: "Autor" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("pede a nova ordenação ao clicar no cabeçalho e ignora a coluna de ações", async () => {
    const user = userEvent.setup();
    const onSortingChange = renderTable();

    await user.click(screen.getByRole("columnheader", { name: "Autor" }));
    expect(onSortingChange).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("columnheader", { name: "Ações" }));
    expect(onSortingChange).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("columnheader", { name: "Ações" }),
    ).not.toHaveAttribute("aria-sort");
  });
});
