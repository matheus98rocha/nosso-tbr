export type DirectoryUserRow = {
  id: string;
  display_name: string;
  email: string | null;
  avatar_seed: string | null;
};

export type DirectoryUser = {
  id: string;
  displayName: string;
  email: string;
  joinedAt: string | null;
  avatarSeed: string | null;
};
