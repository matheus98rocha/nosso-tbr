import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ClientProfileViewModel } from "@/modules/profile/clientProfile/types/clientProfile.types";

import ClientProfile from "./clientProfile";

const baseViewModel: ClientProfileViewModel = {
  displayName: "reader",
  userEmail: "reader@tbr.com",
  avatarInitials: "R",
  avatarSeed: null,
  formattedAccountCreated: "15 de janeiro de 2024",
  formattedLastSignIn: "1 de junho de 2024",
  followingCount: 2,
  followerCount: 4,
  communityPath: "/community",
};

const { mockUseClientProfile } = vi.hoisted(() => ({
  mockUseClientProfile: vi.fn(() => baseViewModel),
}));

vi.mock("@/modules/profile/clientProfile/hooks", () => ({
  useClientProfile: () => mockUseClientProfile(),
}));

vi.mock("@/modules/profile/avatarSelection", () => ({
  AvatarSelectionPanel: () => <div data-testid="avatar-selection-panel" />,
}));

describe("ClientProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClientProfile.mockReturnValue(baseViewModel);
  });

  it("renderiza título e dados da conta", () => {
    render(<ClientProfile />);
    expect(screen.getByRole("heading", { name: /perfil/i })).toBeInTheDocument();
    expect(screen.getByText("reader@tbr.com")).toBeInTheDocument();
    expect(screen.getByText("Conta criada")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("oferece atalho para a Comunidade sem listar membros", () => {
    render(<ClientProfile />);

    expect(
      screen.getByRole("link", { name: /ver comunidade/i }),
    ).toHaveAttribute("href", "/community");
    expect(screen.queryByLabelText(/buscar pessoas/i)).not.toBeInTheDocument();
  });
});
