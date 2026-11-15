export const ACCOUNT_DELETION_IRREVERSIBLE_WARNING =
  "Essa decisão não é reversível.";

const SHARED_READING_NOTE =
  "Em uma leitura compartilhada, esse leitor sai e o livro permanece para os outros.";

export function adminAccountDeletionDescription(displayName: string): string {
  const name = displayName.trim() || "este usuário";
  return `${ACCOUNT_DELETION_IRREVERSIBLE_WARNING} Excluir ${name} remove a conta, os livros, cronogramas, notas e os demais dados ligados a esse leitor. ${SHARED_READING_NOTE}`;
}

export function ownAccountDeletionDescription(): string {
  return `${ACCOUNT_DELETION_IRREVERSIBLE_WARNING} Sua conta, seus livros, cronogramas, notas e os demais dados ligados a você serão removidos. Em uma leitura compartilhada, você sai e o livro permanece para os outros.`;
}
