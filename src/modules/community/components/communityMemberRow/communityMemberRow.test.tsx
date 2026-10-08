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
    isFollower: false,
    isToggleBusy: false,
    isRemoveBusy: false,
    onOpen: vi.fn(),
    onToggleFollow: vi.fn(),
    onRemoveFollower: vi.fn(),
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
    it("mostra cadastrados e lidos quando existe relação de follow", () => {
      renderRow({
        registeredCount: 12,
        finishedCount: 8,
        isFollowing: true,
      });

      expect(screen.getByText("Ana")).toBeInTheDocument();
      expect(screen.getByText("12 cadastrados · 8 lidos")).toBeInTheDocument();
    });

    it("oculta cadastrados e lidos quando ninguém segue ninguém", () => {
      renderRow({
        registeredCount: 12,
        finishedCount: 8,
        isFollowing: false,
        isFollower: false,
        currentlyReadingTitle: "O Nome do Vento",
      });

      expect(
        screen.queryByText("12 cadastrados · 8 lidos"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Lendo O Nome do Vento")).toBeInTheDocument();
    });

    it("mostra o livro em leitura quando existir", () => {
      renderRow({
        registeredCount: 12,
        finishedCount: 8,
        isFollower: true,
        currentlyReadingTitle: "O Nome do Vento",
      });

      expect(screen.getByText("Lendo O Nome do Vento")).toBeInTheDocument();
    });

    it("não inventa leitura quando não há livro sendo lido", () => {
      renderRow({ currentlyReadingTitle: null });

      expect(screen.queryByText(/Lendo /)).not.toBeInTheDocument();
    });
  });

  it("mostra quando o usuário segue o leitor e permite remover quem te segue", async () => {
    const user = userEvent.setup();
    const onRemoveFollower = vi.fn();

    renderRow({
      isFollowing: true,
      isFollower: true,
      onRemoveFollower,
    });

    expect(screen.getByText("Você segue")).toBeInTheDocument();
    expect(screen.getByText("Te segue")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Remover Ana dos seguidores" }),
    );
    expect(onRemoveFollower).toHaveBeenCalledOnce();
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
