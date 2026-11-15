import {
  deleteReaderCascadeFallback,
  isMissingCascadeFunction,
} from "./deleteReaderCascadeFallback";

export {
  partitionReaderBooks,
  type DetachedReaderBook,
  type ReaderBookRow,
} from "./partitionReaderBooks";

const LAST_ADMIN_ERROR = "Não é possível excluir o último admin.";
const PROFILE_NOT_FOUND = "Usuário não encontrado.";
const AUTH_RETRY_ERROR =
  "Dados removidos, mas não foi possível remover o login. Contate o suporte.";

export type DeleteReaderAccountResult = {
  error: string | null;
  status: 200 | 404 | 409 | 500;
};

type ReaderDeletionFailure = {
  message: string;
  status?: number;
  code?: string;
};

export type ReaderDeletionQuery = {
  select: (
    columns: string,
    options?: { count?: "exact"; head?: boolean },
  ) => ReaderDeletionFilter;
  delete: () => ReaderDeletionFilter;
  update: (values: Record<string, unknown>) => ReaderDeletionFilter;
};

export type ReaderDeletionFilter = {
  eq: (column: string, value: string) => ReaderDeletionFilter & Promise<{
    data: Record<string, unknown> | Array<Record<string, unknown>> | null;
    error: { message: string } | null;
    count?: number | null;
  }>;
  in: (
    column: string,
    values: string[],
  ) => Promise<{ error: { message: string } | null }>;
  contains: (column: string, values: string[]) => ReaderDeletionFilter;
  order: (column: string) => ReaderDeletionFilter;
  range: (
    from: number,
    to: number,
  ) => Promise<{
    data: Array<Record<string, unknown>> | null;
    error: { message: string } | null;
  }>;
  maybeSingle: () => Promise<{
    data: Record<string, unknown> | null;
    error: { message: string } | null;
  }>;
};

export type ReaderDeletionClient = {
  rpc: (
    fn: "delete_reader_cascade",
    args: { p_user_id: string },
  ) => Promise<{ error: ReaderDeletionFailure | null }>;
  from: (table: string) => ReaderDeletionQuery;
  auth: {
    admin: {
      deleteUser: (
        userId: string,
      ) => Promise<{ error: ReaderDeletionFailure | null }>;
    };
  };
};

function isMissingAuthUser(error: ReaderDeletionFailure): boolean {
  if (error.code === "user_not_found") return true;

  const message = error.message.toLowerCase();
  return (
    message.includes("user not found") ||
    message.includes("user was not found") ||
    message.includes("usuário não encontrado") ||
    message.includes("usuário não foi encontrado") ||
    message.includes("usuario nao encontrado")
  );
}

function cascadeStatus(message: string): DeleteReaderAccountResult {
  if (message.includes("último admin")) {
    return { error: LAST_ADMIN_ERROR, status: 409 };
  }
  if (message.includes("não encontrado")) {
    return { error: PROFILE_NOT_FOUND, status: 404 };
  }
  return { error: message, status: 500 };
}

async function removeLogin(
  client: ReaderDeletionClient,
  userId: string,
): Promise<"removed" | "missing" | DeleteReaderAccountResult> {
  const { error } = await client.auth.admin.deleteUser(userId);
  if (!error) return "removed";
  if (isMissingAuthUser(error)) return "missing";

  console.error("Auth deleteUser failed after profile delete", {
    userId,
    message: error.message,
  });
  return { error: AUTH_RETRY_ERROR, status: 500 };
}

export async function deleteReaderAccount(
  client: ReaderDeletionClient,
  userId: string,
): Promise<DeleteReaderAccountResult> {
  const { error: cascadeError } = await client.rpc("delete_reader_cascade", {
    p_user_id: userId,
  });

  if (cascadeError) {
    if (isMissingCascadeFunction(cascadeError.message)) {
      const fallback = await deleteReaderCascadeFallback(client, userId);
      if (fallback && fallback.status !== 404) return fallback;
      const profileRemoved = fallback === null;
      const login = await removeLogin(client, userId);
      if (login === "removed" || (profileRemoved && login === "missing")) {
        return { error: null, status: 200 };
      }
      if (login === "missing") return { error: PROFILE_NOT_FOUND, status: 404 };
      return login;
    } else {
      const mapped = cascadeStatus(cascadeError.message);
      if (mapped.status !== 404) return mapped;
    }

    const login = await removeLogin(client, userId);
    if (login === "removed") return { error: null, status: 200 };
    if (login === "missing") return { error: PROFILE_NOT_FOUND, status: 404 };
    return login;
  }

  const login = await removeLogin(client, userId);
  if (typeof login !== "string") return login;
  return { error: null, status: 200 };
}
