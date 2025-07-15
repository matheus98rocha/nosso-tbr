export type BookshelfCreateValidator = {
  name: string;
};

export type BookshelfDomain = {
  id: string;
  name: string;
  createdAt: string;
};

export type BookshelfPersistence = {
  id: string;
  name: string;
  created_at: string;
};

export type SelectedBookshelf = {
  id: string;
  name: string;
};
