import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CommunityViewModel } from "@/modules/community/types/community.types";

const viewModel: CommunityViewModel = {
  view: "todos",
  setView: vi.fn(),
  searchQuery: "",
  inputValue: "",
  onSearchInputChange: vi.fn(),
  onSubmitSearch: vi.fn(),
  onSelectSuggestion: vi.fn(),
  suggestions: [],
  isLoadingSuggestions: false,
  shouldSearchSuggestions: false,
  onClearSearch: vi.fn(),
  currentPage: 0,
  totalPages: 1,
  onPageChange: vi.fn(),
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
  mutualCount: 0,
  removalMember: null,
  onRequestRemoveFollower: vi.fn(),
  onCancelRemoveFollower: vi.fn(),
  onConfirmRemoveFollower: vi.fn(),
  isRemovePending: false,
  pendingRemovalUserId: null,
};

const { mockUseCommunity } = vi.hoisted(() => ({
  mockUseCommunity: vi.fn(),
}));

vi.mock("./hooks/useCommunity", () => ({
  useCommunity: () => mockUseCommunity(),
}));

import CommunityScreen from "./communityScreen";

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("(min-width: 640px)"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("CommunityScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubMatchMedia();
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
    expect(screen.getByText("Te segue")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Buscar leitores" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "pagination" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
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

  it("pede para remover quem segue o usuário", async () => {
    const user = userEvent.setup();
    render(<CommunityScreen />);

    await user.click(
      screen.getByRole("button", { name: "Remover Ana dos seguidores" }),
    );

    expect(viewModel.onRequestRemoveFollower).toHaveBeenCalledWith("ana");
  });
});
