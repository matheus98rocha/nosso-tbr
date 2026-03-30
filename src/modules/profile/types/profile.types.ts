export type ProfilePublicUser = {
  id: string;
  displayName: string;
  email: string;
  joinedAt: string;
};

export type ProfileSchemaMock = {
  profiles: {
    id: string;
    userId: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
  publicDirectory: {
    userId: string;
    visibility: "public" | "friends";
  };
};
