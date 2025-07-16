export type BookshelfCreateValidator = {
  name: string;
  owner: "Matheus" | "Fabi";
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
  owner: "Matheus" | "Fabi";
  createdAt: string;
  books: {
    id: string;
    imageUrl: string;
  }[];
};

export type BookshelfPersistence = {
  id: string;
  name: string;
  owner: "Matheus" | "Fabi";
  created_at: string;
  custom_shelf_books: BookInShelf[];
};

export type SelectedBookshelf = {
  id: string;
  owner: string;
  name: string;
};
