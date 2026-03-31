import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListGrid } from "./listGrid";

describe("ListGrid", () => {
  it("renders empty message when fetched with no items", () => {
    render(
      <ListGrid
        items={[]}
        isLoading={false}
        isFetched
        renderItem={() => null}
        emptyMessage="Nothing here"
      />,
    );

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
