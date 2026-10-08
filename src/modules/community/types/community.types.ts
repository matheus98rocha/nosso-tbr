export type CommunityView = "todos" | "seguidores" | "seguindo" | "mutuos";

export type CommunityMember = {
  id: string;
  displayName: string;
  avatarSeed: string | null;
  isFollowing: boolean;
  isFollower: boolean;
  mostReadGender: string | null;
  mostRegisteredGender: string | null;
  registeredCount: number;
  finishedCount: number;
  currentlyReadingTitle: string | null;
};

export type GenreCount = {
  gender: string;
  count: number;
};

export type CommunityActivityRow = {
  readerId: string;
  registeredCount: number;
  finishedCount: number;
  currentlyReadingTitle: string | null;
};

export type CommunityMemberSuggestion = {
  id: string;
  displayName: string;
};

export type CommunityMembersPage = {
  members: CommunityMember[];
  total: number;
};

export type CommunitySnapshot = {
  members: CommunityMember[];
  followingIds: string[];
  followerIds: string[];
};

export type CommunityGenreRow = {
  readerId: string;
  gender: string;
  finishedCount: number;
  registeredCount: number;
};

export type CommunityViewModel = {
  view: CommunityView;
  setView: (view: CommunityView) => void;
  searchQuery: string;
  inputValue: string;
  onSearchInputChange: (value: string) => void;
  onSubmitSearch: (value: string) => void;
  onSelectSuggestion: (suggestion: CommunityMemberSuggestion) => void;
  suggestions: CommunityMemberSuggestion[];
  isLoadingSuggestions: boolean;
  shouldSearchSuggestions: boolean;
  onClearSearch: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number | ((currentPage: number) => number)) => void;
  followingCount: number;
  followerCount: number;
  mutualCount: number;
  members: CommunityMember[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  onRetry: () => void;
  selectedMember: CommunityMember | null;
  onOpenMember: (memberId: string) => void;
  onCloseMember: () => void;
  onToggleFollow: (memberId: string) => void;
  pendingUserId: string | null;
  isTogglePending: boolean;
  onOpenMemberProfile: (memberId: string) => void;
  removalMember: CommunityMember | null;
  onRequestRemoveFollower: (memberId: string) => void;
  onCancelRemoveFollower: () => void;
  onConfirmRemoveFollower: () => void;
  isRemovePending: boolean;
  pendingRemovalUserId: string | null;
};
