import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProfileHubLinks from "./ProfileHubLinks";

describe("ProfileHubLinks", () => {
  it("renderiza atalhos com hrefs", () => {
    render(
      <ProfileHubLinks
        links={[
          { href: "/stats", label: "Estatísticas" },
          { href: "/shelves", label: "Estantes" },
          { href: "/community", label: "Comunidade" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: /estatísticas/i })).toHaveAttribute(
      "href",
      "/stats",
    );
    expect(screen.getByRole("link", { name: /estantes/i })).toHaveAttribute(
      "href",
      "/shelves",
    );
    expect(screen.getByRole("link", { name: /comunidade/i })).toHaveAttribute(
      "href",
      "/community",
    );
  });
});
