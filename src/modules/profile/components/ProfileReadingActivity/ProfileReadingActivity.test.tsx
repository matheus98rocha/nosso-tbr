import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProfileReadingActivity from "./ProfileReadingActivity";

describe("ProfileReadingActivity", () => {
  it("mostra contagens e título em leitura", () => {
    render(
      <ProfileReadingActivity
        registeredCount={10}
        finishedCount={4}
        currentlyReadingTitle="Duna"
      />,
    );

    expect(screen.getByText(/10 cadastrados/i)).toBeInTheDocument();
    expect(screen.getByText(/4 lidos/i)).toBeInTheDocument();
    expect(screen.getByText(/lendo duna/i)).toBeInTheDocument();
  });

  it("mostra erro em pt-BR", () => {
    render(
      <ProfileReadingActivity
        registeredCount={0}
        finishedCount={0}
        currentlyReadingTitle={null}
        isError
      />,
    );

    expect(
      screen.getByText(/não foi possível carregar a atividade/i),
    ).toBeInTheDocument();
  });
});
