export type BookshelfCreateValidator = {
  name: string;
};

export type BookInShelf = {
  book: {
    id: string;
    image_url: string;
  };
};

export type BookshelfDomain = {
  id: string;
  name: string;
  createdAt: string;
  books: {
    id: string;
    imageUrl: string;
  }[];
};

export type BookshelfPersistence = {
  id: string;
  name: string;
  created_at: string;
  custom_shelf_books: BookInShelf[];
  user_id: string;
};

export type SelectedBookshelf = {
  id: string;
  name: string;
};
