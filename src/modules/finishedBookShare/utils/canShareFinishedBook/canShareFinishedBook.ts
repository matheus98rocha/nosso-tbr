export function canShareFinishedBook(input: {
  isLogged: boolean;
  isParticipant: boolean;
  isShelf: boolean;
  status: string | null | undefined;
}): boolean {
  return (
    input.isLogged &&
    input.isParticipant &&
    !input.isShelf &&
    input.status === "finished"
  );
}
