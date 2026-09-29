import type { MenuItem } from "./header.types";

export type BottomNavProps = {
  items: MenuItem[];
  overflowItems: MenuItem[];
  pathname: string;
};
