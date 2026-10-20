import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ClientProfileViewModel } from "@/modules/profile/clientProfile/types/clientProfile.types";

import ClientProfile from "./clientProfile";

const baseViewModel: ClientProfileViewModel = {
  userId: "user-1",
  displayName: "reader",
  userEmail: "reader@tbr.com",
  avatarInitials: "R",
  avatarSeed: null,
  formattedAccountCreated: "15 de janeiro de 2024",
  formattedLastSignIn: "1 de junho de 2024",
  followingCount: 2,
  followerCount: 4,
  communityPath: "/community",
  followingHref: "/community?view=seguindo",
  followersHref: "/community?view=seguidores",
  allBooksHref: "/?reader=user-1",
  hubLinks: [
    { href: "/stats", label: "Estatísticas" },
    { href: "/shelves", label: "Estantes" },
    { href: "/community", label: "Comunidade" },
  ],
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

vi.mock("@/modules/onboarding", () => ({
  ProfileWelcomeTutorial: () => (
    <button type="button">Ver tutorial de novo</button>
  ),
}));

vi.mock("@/modules/profile/hooks", () => ({
  useProfileReadingShowcase: () => ({
    data: {
      registeredCount: 10,
      finishedCount: 4,
      currentlyReadingTitle: "Duna",
      mostReadGenderLabel: "Fantasia",
      mostRegisteredGenderLabel: "Romance",
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/modules/profile/memberProfile/hooks", () => ({
  useMemberProfileFavorites: () => ({
    data: [],
    isLoading: false,
    isFetched: true,
    isError: false,
  }),
}));

vi.mock("@/components/bookCard/bookCard", () => ({
  BookCard: () => <div data-testid="book-card" />,
}));

vi.mock("@/components/listGrid", () => ({
  ListGrid: ({ emptyMessage }: { emptyMessage: string }) => (
    <p>{emptyMessage}</p>
  ),
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

  it("mostra atividade, gêneros, favoritos e hub", () => {
    render(<ClientProfile />);

    expect(screen.getByText(/atividade de leitura/i)).toBeInTheDocument();
    expect(screen.getByText(/10 cadastrados/i)).toBeInTheDocument();
    expect(screen.getByText(/lendo duna/i)).toBeInTheDocument();
    expect(screen.getByText(/gêneros em destaque/i)).toBeInTheDocument();
    expect(screen.getByText("Fantasia")).toBeInTheDocument();
    expect(screen.getByText(/livros favoritos/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /estatísticas/i })).toHaveAttribute(
      "href",
      "/stats",
    );
    expect(screen.getByRole("link", { name: /estantes/i })).toHaveAttribute(
      "href",
      "/shelves",
    );
    expect(screen.getByRole("link", { name: /^comunidade$/i })).toHaveAttribute(
      "href",
      "/community",
    );
  });

  it("torna contagens da rede clicáveis para a Comunidade", () => {
    render(<ClientProfile />);

    expect(screen.getByRole("link", { name: /seguindo 2/i })).toHaveAttribute(
      "href",
      "/community?view=seguindo",
    );
    expect(screen.getByRole("link", { name: /seguidores 4/i })).toHaveAttribute(
      "href",
      "/community?view=seguidores",
    );
  });

  it("oferece reabrir o tutorial", () => {
    render(<ClientProfile />);
    expect(
      screen.getByRole("button", { name: /ver tutorial de novo/i }),
    ).toBeInTheDocument();
  });
});
