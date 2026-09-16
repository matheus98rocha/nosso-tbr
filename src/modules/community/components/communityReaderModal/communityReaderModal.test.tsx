import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CommunityMember } from "@/modules/community/types/community.types";

import CommunityReaderModal from "./communityReaderModal";

const member: CommunityMember = {
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
};

describe("CommunityReaderModal", () => {
  it("mostra gêneros mais lido e mais cadastrado", () => {
    render(
      <CommunityReaderModal
        member={member}
        open
        isToggleBusy={false}
        onOpenChange={vi.fn()}
        onToggleFollow={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    );

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Fantasia")).toBeInTheDocument();
    expect(screen.getByText("Ficção")).toBeInTheDocument();
    expect(screen.getByText("12 cadastrados · 8 lidos")).toBeInTheDocument();
    expect(screen.getByText("Lendo O Nome do Vento")).toBeInTheDocument();
  });

  it("omite o livro em leitura quando o leitor não está lendo", () => {
    render(
      <CommunityReaderModal
        member={{ ...member, currentlyReadingTitle: null }}
        open
        isToggleBusy={false}
        onOpenChange={vi.fn()}
        onToggleFollow={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Lendo /)).not.toBeInTheDocument();
  });

  it("explica a ausência quando não há gêneros destacados", () => {
    render(
      <CommunityReaderModal
        member={{ ...member, mostReadGender: null, mostRegisteredGender: null }}
        open
        isToggleBusy={false}
        onOpenChange={vi.fn()}
        onToggleFollow={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Ainda não há gênero destacado nas leituras finalizadas.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ainda não há gênero destacado nos livros cadastrados.",
      ),
    ).toBeInTheDocument();
  });

  it("oferece ver o perfil completo", async () => {
    const user = userEvent.setup();
    const onOpenProfile = vi.fn();

    render(
      <CommunityReaderModal
        member={member}
        open
        isToggleBusy={false}
        onOpenChange={vi.fn()}
        onToggleFollow={vi.fn()}
        onOpenProfile={onOpenProfile}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Ver perfil" }));
    expect(onOpenProfile).toHaveBeenCalledOnce();
  });
});
