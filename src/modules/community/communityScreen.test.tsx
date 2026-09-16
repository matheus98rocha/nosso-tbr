import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CommunityViewModel } from "@/modules/community/types/community.types";

const viewModel: CommunityViewModel = {
  view: "todos",
  setView: vi.fn(),
  searchQuery: "",
  onSearchChange: vi.fn(),
  onClearSearch: vi.fn(),
  followingCount: 1,
  followerCount: 2,
  members: [
    {
      id: "ana",
      displayName: "Ana",
      avatarSeed: null,
      isFollowing: false,
      isFollower: true,
      mostReadGender: "fantasy",
      mostRegisteredGender: "fiction",
      registeredCount: 12,
      finishedCount: 8,
      currentlyReadingTitle: "O Nome do Vento",
    },
  ],
  isLoading: false,
  isError: false,
  isEmpty: false,
  onRetry: vi.fn(),
  selectedMember: null,
  onOpenMember: vi.fn(),
  onCloseMember: vi.fn(),
  onToggleFollow: vi.fn(),
  pendingUserId: null,
  isTogglePending: false,
  onOpenMemberProfile: vi.fn(),
};

const { mockUseCommunity } = vi.hoisted(() => ({
  mockUseCommunity: vi.fn(),
}));

vi.mock("./hooks/useCommunity", () => ({
  useCommunity: () => mockUseCommunity(),
}));

import CommunityScreen from "./communityScreen";

describe("CommunityScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCommunity.mockReturnValue(viewModel);
  });

  it("mostra contagens, recortes e leitores com avatar e nome", () => {
    render(<CommunityScreen />);

    expect(
      screen.getByRole("heading", { name: "Comunidade" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.queryByText("Fantasia")).not.toBeInTheDocument();
    expect(screen.getByText("12 cadastrados · 8 lidos")).toBeInTheDocument();
    expect(screen.getByText("Lendo O Nome do Vento")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("mostra estado vazio em pt-BR", () => {
    mockUseCommunity.mockReturnValue({
      ...viewModel,
      members: [],
      isEmpty: true,
    });

    render(<CommunityScreen />);

    expect(
      screen.getByText("Ainda não há outros leitores por aqui."),
    ).toBeInTheDocument();
  });

  it("abre o modal ao tocar no leitor", async () => {
    const user = userEvent.setup();
    render(<CommunityScreen />);

    await user.click(screen.getByText("Ana"));
    expect(viewModel.onOpenMember).toHaveBeenCalledWith("ana");
  });
});
