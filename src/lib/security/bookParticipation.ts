/**
 * Alinhado a Second Brain business-rules RN42 / RN43: participação em livro (leitura coletiva).
 * Usado nas rotas API (camada app) em conjunto com RLS no banco.
 */
export type BookParticipationRow = {
  user_id: string | null | undefined;
  chosen_by: string | null | undefined;
  readers: string[] | null | undefined;
};

export function canUserParticipateInBook(
  userId: string,
  row: BookParticipationRow,
): boolean {
  const uid = row.user_id?.trim();
  if (uid && uid === userId) return true;
  if (row.chosen_by && row.chosen_by === userId) return true;
  const readers = row.readers ?? [];
  return readers.includes(userId);
}
