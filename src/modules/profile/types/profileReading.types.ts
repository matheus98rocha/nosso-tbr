export type ProfileReadingShowcase = {
  readerId: string;
  registeredCount: number;
  finishedCount: number;
  currentlyReadingTitle: string | null;
  mostReadGender: string | null;
  mostRegisteredGender: string | null;
  mostReadGenderLabel: string | null;
  mostRegisteredGenderLabel: string | null;
};

export type ProfileNetworkCounts = {
  userId: string;
  followingCount: number;
  followerCount: number;
};
