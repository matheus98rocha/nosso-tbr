const LAST_ADMIN_ERROR = "Não é possível excluir o último admin.";

type LastAdminClient = {
  from: (table: string) => {
    select: (
      columns: string,
      options: { count: "exact"; head: true },
    ) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{
        count: number | null;
        error: { message: string } | null;
      }>;
    };
  };
};

export async function lastAdminDeletionBlock(
  client: LastAdminClient,
  tier: string | null | undefined,
): Promise<{ status: 409 | 500; error: string } | null> {
  if (tier !== "admin") return null;

  const { count, error } = await client
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("tier", "admin");

  if (error) {
    return { status: 500, error: error.message };
  }

  if ((count ?? 0) <= 1) {
    return { status: 409, error: LAST_ADMIN_ERROR };
  }

  return null;
}
