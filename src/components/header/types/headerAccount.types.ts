export type HeaderAccountViewModel = {
  displayName: string;
  email: string;
  avatarInitials: string;
  avatarSeed: string | null;
};

export type HeaderAccountMenuProps = {
  account: HeaderAccountViewModel | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  onNavigateToProfile: () => void;
  onLogout: () => void;
  onNavigateToAuth: () => void;
  showDisplayName?: boolean;
  className?: string;
};

export type HeaderAccountSummaryProps = {
  account: HeaderAccountViewModel;
  className?: string;
};
