import { describe, expect, it } from "vitest";

import { canShareFinishedBook } from "./canShareFinishedBook";

const eligible = {
  isLogged: true,
  isParticipant: true,
  isShelf: false,
  status: "finished" as const,
};

describe("canShareFinishedBook", () => {
  it("aceita participante autenticado com livro finalizado fora da estante", () => {
    expect(canShareFinishedBook(eligible)).toBe(true);
  });

  it("recusa reading mesmo com a chamada vinda de um progresso cheio", () => {
    expect(canShareFinishedBook({ ...eligible, status: "reading" })).toBe(false);
  });

  it("recusa estante, sessão ausente e quem não participa", () => {
    expect(canShareFinishedBook({ ...eligible, isShelf: true })).toBe(false);
    expect(canShareFinishedBook({ ...eligible, isLogged: false })).toBe(false);
    expect(canShareFinishedBook({ ...eligible, isParticipant: false })).toBe(false);
  });

  it("recusa paused, abandoned, planned e not_started", () => {
    expect(canShareFinishedBook({ ...eligible, status: "paused" })).toBe(false);
    expect(canShareFinishedBook({ ...eligible, status: "abandoned" })).toBe(false);
    expect(canShareFinishedBook({ ...eligible, status: "planned" })).toBe(false);
    expect(canShareFinishedBook({ ...eligible, status: "not_started" })).toBe(false);
  });
});
