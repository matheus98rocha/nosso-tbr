const LAST_ADMIN_ERROR = "Não é possível excluir o último admin.";
const PROFILE_NOT_FOUND = "Usuário não encontrado.";
const AUTH_RETRY_ERROR =
  "Dados removidos, mas não foi possível remover o login. Contate o suporte.";

export type ReaderBookRow = {
  id: string;
  chosen_by: string | null;
  user_id: string | null;
  readers: string[] | null;
};

export type DetachedReaderBook = {
  id: string;
  chosen_by: string;
  user_id: string | null;
  readers: string[];
};

export type DeleteReaderAccountResult = {
  error: string | null;
  status: 200 | 404 | 409 | 500;
};

type ReaderDeletionFailure = {
  message: string;
  status?: number;
};

export type ReaderDeletionClient = {
  rpc: (
    fn: "delete_reader_cascade",
    args: { p_user_id: string },
  ) => Promise<{ error: ReaderDeletionFailure | null }>;
  auth: {
    admin: {
      deleteUser: (
        userId: string,
      ) => Promise<{ error: ReaderDeletionFailure | null }>;
    };
  };
};

function isOtherLivingUser(
  id: string | null | undefined,
  userId: string,
  livingUserIds: ReadonlySet<string>,
): id is string {
  return (
    typeof id === "string" &&
    id.length > 0 &&
    id !== userId &&
    livingUserIds.has(id)
  );
}

function survivorIds(
  book: ReaderBookRow,
  userId: string,
  livingUserIds: ReadonlySet<string>,
): string[] {
  const ids = new Set<string>();
  for (const readerId of book.readers ?? []) {
    if (isOtherLivingUser(readerId, userId, livingUserIds)) ids.add(readerId);
  }
  if (isOtherLivingUser(book.chosen_by, userId, livingUserIds)) {
    ids.add(book.chosen_by);
  }
  if (isOtherLivingUser(book.user_id, userId, livingUserIds)) {
    ids.add(book.user_id);
  }
  return [...ids];
}

function livingReaders(
  book: ReaderBookRow,
  userId: string,
  livingUserIds: ReadonlySet<string>,
): string[] {
  const seen = new Set<string>();
  const readers: string[] = [];
  for (const readerId of book.readers ?? []) {
    if (
      !isOtherLivingUser(readerId, userId, livingUserIds) ||
      seen.has(readerId)
    ) {
      continue;
    }
    seen.add(readerId);
    readers.push(readerId);
  }
  return readers;
}

export function partitionReaderBooks(
  books: ReaderBookRow[],
  userId: string,
  livingUserIds: ReadonlySet<string>,
): { deleteIds: string[]; detach: DetachedReaderBook[] } {
  const unique = new Map<string, ReaderBookRow>();
  for (const book of books) {
    if (book.id) unique.set(book.id, book);
  }

  const deleteIds: string[] = [];
  const detach: DetachedReaderBook[] = [];

  for (const book of unique.values()) {
    const survivors = survivorIds(book, userId, livingUserIds);
    if (survivors.length === 0) {
      deleteIds.push(book.id);
      continue;
    }

    detach.push({
      id: book.id,
      chosen_by: isOtherLivingUser(book.chosen_by, userId, livingUserIds)
        ? book.chosen_by
        : survivors[0],
      user_id: isOtherLivingUser(book.user_id, userId, livingUserIds)
        ? book.user_id
        : null,
      readers: livingReaders(book, userId, livingUserIds),
    });
  }

  return { deleteIds, detach };
}

function isMissingAuthUser(error: ReaderDeletionFailure): boolean {
  const message = error.message.toLowerCase();
  return (
    error.status === 404 ||
    message.includes("not found") ||
    message.includes("não encontrado")
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
    const mapped = cascadeStatus(cascadeError.message);
    if (mapped.status !== 404) return mapped;

    const login = await removeLogin(client, userId);
    if (login === "removed") return { error: null, status: 200 };
    if (login === "missing") return { error: PROFILE_NOT_FOUND, status: 404 };
    return login;
  }

  const login = await removeLogin(client, userId);
  if (typeof login !== "string") return login;
  return { error: null, status: 200 };
}
