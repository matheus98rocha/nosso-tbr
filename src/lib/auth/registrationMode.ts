export const REGISTRATION_MODES = ["invite", "open"] as const;

export type RegistrationMode = (typeof REGISTRATION_MODES)[number];

export const REGISTRATION_SETTINGS_ID = "default";

type SettingsError = {
  message: string;
  code?: string;
};

type SettingsResult = {
  data: { mode: string } | null;
  error: SettingsError | null;
};

export type RegistrationSettingsClient = {
  from: (table: "registration_settings") => {
    select: (columns: "mode") => {
      eq: (
        column: "id",
        value: typeof REGISTRATION_SETTINGS_ID,
      ) => {
        maybeSingle: () => Promise<SettingsResult>;
      };
    };
    upsert: (
      values: {
        id: typeof REGISTRATION_SETTINGS_ID;
        mode: RegistrationMode;
        updated_at: string;
        updated_by: string;
      },
      options: { onConflict: "id" },
    ) => {
      select: (columns: "mode") => {
        single: () => Promise<SettingsResult>;
      };
    };
  };
};

export function isRegistrationMode(value: unknown): value is RegistrationMode {
  return value === "invite" || value === "open";
}

export async function readRegistrationMode(
  client: RegistrationSettingsClient,
): Promise<
  | { ok: true; mode: RegistrationMode }
  | { ok: false; error: SettingsError }
> {
  const { data, error } = await client
    .from("registration_settings")
    .select("mode")
    .eq("id", REGISTRATION_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return { ok: true, mode: "invite" };
    }
    return { ok: false, error };
  }

  if (!data) {
    return { ok: true, mode: "invite" };
  }

  if (!isRegistrationMode(data.mode)) {
    return {
      ok: false,
      error: { message: "Modo de inscrição desconhecido." },
    };
  }

  return { ok: true, mode: data.mode };
}

export async function writeRegistrationMode(
  client: RegistrationSettingsClient,
  input: { mode: RegistrationMode; updatedBy: string; now?: Date },
): Promise<
  | { ok: true; mode: RegistrationMode }
  | { ok: false; error: SettingsError }
> {
  const { data, error } = await client
    .from("registration_settings")
    .upsert(
      {
        id: REGISTRATION_SETTINGS_ID,
        mode: input.mode,
        updated_at: (input.now ?? new Date()).toISOString(),
        updated_by: input.updatedBy,
      },
      { onConflict: "id" },
    )
    .select("mode")
    .single();

  if (error || !data || data.mode !== input.mode) {
    return {
      ok: false,
      error: error ?? { message: "Modo de inscrição não foi gravado." },
    };
  }

  return { ok: true, mode: input.mode };
}
