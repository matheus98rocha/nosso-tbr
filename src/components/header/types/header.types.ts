export type MenuItem = {
  label: string;
  action: () => void;
  requiresAuth?: boolean;
  hideIfLoggedIn?: boolean;
  path?: string;
};

export type Menu = {
  label: string;
  items: MenuItem[];
};
