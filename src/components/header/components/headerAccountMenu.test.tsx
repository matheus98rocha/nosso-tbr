import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import HeaderAccountMenu from "./headerAccountMenu";

vi.mock("@/modules/profile/components", () => ({
  ProfileAvatar: ({ initials }: { initials: string }) => (
    <div data-testid="avatar">{initials}</div>
  ),
}));

const sampleAccount = {
  displayName: "Matheus Silva",
  email: "matheus.silva@example.com",
  avatarInitials: "MS",
  avatarSeed: null,
};

describe("HeaderAccountMenu", () => {
  it("shows display name in trigger and keeps email inside the dropdown", async () => {
    const user = userEvent.setup();

    render(
      <HeaderAccountMenu
        account={sampleAccount}
        isLoading={false}
        isLoggedIn
        onNavigateToProfile={vi.fn()}
        onNavigateToAuth={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByText("Matheus Silva")).toBeInTheDocument();
    expect(screen.queryByText("matheus.silva@example.com")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Menu da conta de Matheus Silva" }),
    );

    expect(screen.getAllByText("Matheus Silva").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("matheus.silva@example.com")).toBeInTheDocument();
    expect(screen.getByText("Meu perfil")).toBeInTheDocument();
  });
});
