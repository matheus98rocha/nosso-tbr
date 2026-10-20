export type ProfileReadingActivityProps = {
  registeredCount: number;
  finishedCount: number;
  currentlyReadingTitle: string | null;
  isLoading?: boolean;
  isError?: boolean;
};
