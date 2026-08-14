import { render, screen } from "@testing-library/react";

import AuthLayout, { metadata } from "./layout";

describe("AuthLayout", () => {
  it("should render children correctly", () => {
    render(
      <AuthLayout>
        <div data-testid="child-element">Child</div>
      </AuthLayout>,
    );

    expect(
      screen.getByRole("region", { name: "Autenticação" }),
    ).toContainElement(screen.getByTestId("child-element"));
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it("should have correct metadata", () => {
    expect(metadata.title).toBe("Auth - Nosso TBR");
    expect(typeof metadata.title).toBe("string");
    expect(metadata.title.length).toBeGreaterThan(0);
  });
});
