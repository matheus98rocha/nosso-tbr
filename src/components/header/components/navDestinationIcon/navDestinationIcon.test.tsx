import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NavDestinationIcon from "./navDestinationIcon";

describe("NavDestinationIcon", () => {
  it("renderiza o ícone Users para Comunidade", () => {
    render(
      <div>
        <NavDestinationIcon label="Comunidade" />
        Comunidade
      </div>,
    );

    expect(document.querySelector("svg.lucide-users")).not.toBeNull();
  });

  it("não renderiza ícone para rótulo desconhecido", () => {
    const { container } = render(<NavDestinationIcon label="Desconhecido" />);

    expect(container.querySelector("svg")).toBeNull();
  });
});
