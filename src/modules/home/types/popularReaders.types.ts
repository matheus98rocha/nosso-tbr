export type PopularReader = {
  id: string;
  displayName: string;
  avatarSeed: string | null;
  followerCount: number;
  sharedGenderCount: number;
  sharedAuthorCount: number;
  score: number;
  isFollowing: boolean;
};

export type PopularReaderRpcRow = {
  reader_id: string;
  display_name: string | null;
  avatar_seed: string | null;
  follower_count: number | string;
  shared_gender_count: number | string;
  shared_author_count: number | string;
  score: number | string;
};

export type PopularReadersViewModel = {
  readers: PopularReader[];
  isLoading: boolean;
  isError: boolean;
  isHidden: boolean;
  shouldRender: boolean;
  isTogglePending: boolean;
  pendingUserId: string | null;
  hide: () => void;
  show: () => void;
  follow: (readerId: string) => void;
};

export const POPULAR_READERS_LIMIT = 12;
