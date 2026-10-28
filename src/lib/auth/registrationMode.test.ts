import { describe, expect, it, vi } from "vitest";

import {
  readRegistrationMode,
  writeRegistrationMode,
  type RegistrationSettingsClient,
} from "./registrationMode";

function settingsClient(result: {
  data: { mode: string } | null;
  error?: { message: string; code?: string } | null;
}) {
  const payload = {
    data: result.data,
    error: result.error ?? null,
  };
  const maybeSingle = vi.fn().mockResolvedValue(payload);
  const single = vi.fn().mockResolvedValue(payload);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const upsert = vi.fn(() => ({
    select: vi.fn(() => ({ single })),
  }));
  const client: RegistrationSettingsClient = {
    from: vi.fn(() => ({
      select,
      upsert,
    })),
  };

  return { client, upsert };
}

describe("readRegistrationMode", () => {
  it("devolve invite quando ainda não há linha", async () => {
    const { client } = settingsClient({ data: null });
    await expect(readRegistrationMode(client)).resolves.toEqual({
      ok: true,
      mode: "invite",
    });
  });

  it("devolve o modo gravado", async () => {
    const { client } = settingsClient({ data: { mode: "open" } });
    await expect(readRegistrationMode(client)).resolves.toEqual({
      ok: true,
      mode: "open",
    });
  });

  it("mantém convites quando a tabela ainda não existe", async () => {
    const { client } = settingsClient({
      data: null,
      error: { message: "relation does not exist", code: "42P01" },
    });
    await expect(readRegistrationMode(client)).resolves.toEqual({
      ok: true,
      mode: "invite",
    });
  });

  it("mantém convites quando o PostgREST ainda não enxerga a tabela", async () => {
    const { client } = settingsClient({
      data: null,
      error: {
        message: "Could not find the table 'public.registration_settings' in the schema cache",
        code: "PGRST205",
      },
    });
    await expect(readRegistrationMode(client)).resolves.toEqual({
      ok: true,
      mode: "invite",
    });
  });

  it("propaga erro de leitura", async () => {
    const { client } = settingsClient({
      data: null,
      error: { message: "connection failed", code: "08006" },
    });
    await expect(readRegistrationMode(client)).resolves.toEqual({
      ok: false,
      error: { message: "connection failed", code: "08006" },
    });
  });

  it("rejeita modo desconhecido", async () => {
    const { client } = settingsClient({ data: { mode: "public" } });
    await expect(readRegistrationMode(client)).resolves.toEqual({
      ok: false,
      error: { message: "Modo de inscrição desconhecido." },
    });
  });
});

describe("writeRegistrationMode", () => {
  it("grava o modo e confirma o valor salvo", async () => {
    const { client, upsert } = settingsClient({ data: { mode: "open" } });
    const now = new Date("2026-10-28T15:00:00.000Z");

    await expect(
      writeRegistrationMode(client, {
        mode: "open",
        updatedBy: "admin-1",
        now,
      }),
    ).resolves.toEqual({ ok: true, mode: "open" });

    expect(upsert).toHaveBeenCalledWith(
      {
        id: "default",
        mode: "open",
        updated_at: "2026-10-28T15:00:00.000Z",
        updated_by: "admin-1",
      },
      { onConflict: "id" },
    );
  });

  it("falha quando o banco não devolve o modo pedido", async () => {
    const { client } = settingsClient({ data: { mode: "invite" } });
    await expect(
      writeRegistrationMode(client, {
        mode: "open",
        updatedBy: "admin-1",
      }),
    ).resolves.toEqual({
      ok: false,
      error: { message: "Modo de inscrição não foi gravado." },
    });
  });
});
