import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClientProfile from "./clientProfile";
import type { ClientProfileViewModel } from "@/modules/profile/clientProfile/types/clientProfile.types";

const baseViewModel: ClientProfileViewModel = {
  displayName: "reader",
  userEmail: "reader@tbr.com",
  avatarInitials: "R",
  formattedAccountCreated: "15 de janeiro de 2024",
  formattedLastSignIn: "1 de junho de 2024",
  followingCount: 2,
  searchQuery: "",
  onCommunitySearchChange: vi.fn(),
  onClearCommunitySearch: vi.fn(),
  communityRows: [],
  isDirectoryLoading: false,
  isCommunityEmpty: true,
};

const { mockUseClientProfile } = vi.hoisted(() => ({
  mockUseClientProfile: vi.fn(() => baseViewModel),
}));

vi.mock("@/modules/profile/clientProfile/hooks", () => ({
  useClientProfile: () => mockUseClientProfile(),
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
  });

  it("chama onClearCommunitySearch ao limpar busca na lista vazia", async () => {
    const user = userEvent.setup();
    render(<ClientProfile />);
    await user.click(screen.getByRole("button", { name: /limpar busca de pessoas/i }));
    expect(baseViewModel.onClearCommunitySearch).toHaveBeenCalled();
  });
});
