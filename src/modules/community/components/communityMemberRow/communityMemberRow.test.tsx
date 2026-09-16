import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import CommunityMemberRow from "./communityMemberRow";
import type { CommunityMemberRowProps } from "./types/communityMemberRow.types";

function renderRow(overrides: Partial<CommunityMemberRowProps> = {}) {
  const props: CommunityMemberRowProps = {
    memberId: "ana",
    displayName: "Ana",
    avatarSeed: null,
    registeredCount: 0,
    finishedCount: 0,
    currentlyReadingTitle: null,
    isFollowing: false,
    isToggleBusy: false,
    onOpen: vi.fn(),
    onToggleFollow: vi.fn(),
    ...overrides,
  };

  return { ...render(<CommunityMemberRow {...props} />), props };
}

describe("CommunityMemberRow", () => {
  it("mostra avatar, nome e ação de seguir", () => {
    renderRow();

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Seguir Ana" }),
    ).toBeInTheDocument();
  });

  it("não mostra o gênero mais lido na label", () => {
    renderRow();

    expect(screen.queryByText("Fantasia")).not.toBeInTheDocument();
  });

  describe("RN-COM-13", () => {
    it("mostra cadastrados e lidos na label do leitor", () => {
      renderRow({
        registeredCount: 12,
        finishedCount: 8,
      });

      expect(screen.getByText("Ana")).toBeInTheDocument();
      expect(screen.getByText("12 cadastrados · 8 lidos")).toBeInTheDocument();
    });

    it("mostra o livro em leitura quando existir", () => {
      renderRow({
        registeredCount: 12,
        finishedCount: 8,
        currentlyReadingTitle: "O Nome do Vento",
      });

      expect(screen.getByText("Lendo O Nome do Vento")).toBeInTheDocument();
    });

    it("não inventa leitura quando não há livro sendo lido", () => {
      renderRow({ currentlyReadingTitle: null });

      expect(screen.queryByText(/Lendo /)).not.toBeInTheDocument();
    });
  });

  it("abre o leitor ao tocar no nome e segue no botão dedicado", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onToggleFollow = vi.fn();

    renderRow({
      onOpen,
      onToggleFollow,
    });

    await user.click(
      screen.getByRole("button", { name: "Ver detalhes de Ana" }),
    );
    expect(onOpen).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Seguir Ana" }));
    expect(onToggleFollow).toHaveBeenCalledOnce();
  });
});
