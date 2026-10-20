import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProfileGenreHighlights from "./ProfileGenreHighlights";

describe("ProfileGenreHighlights", () => {
  it("mostra gêneros quando existem", () => {
    render(
      <ProfileGenreHighlights
        mostReadGenderLabel="Fantasia"
        mostRegisteredGenderLabel="Romance"
      />,
    );

    expect(screen.getByText("Fantasia")).toBeInTheDocument();
    expect(screen.getByText("Romance")).toBeInTheDocument();
  });

  it("mostra ausência quando não há gêneros", () => {
    render(
      <ProfileGenreHighlights
        mostReadGenderLabel={null}
        mostRegisteredGenderLabel={null}
      />,
    );

    expect(
      screen.getByText(/ainda não há gênero destacado/i),
    ).toBeInTheDocument();
  });
});
