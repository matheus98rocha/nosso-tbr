import { JSX } from "react";

export interface NavItemData {
  label: string;
  path?: string;
  action?: () => void;
  icon?: JSX.Element;
}

export interface DesktopNavMenuProps {
  isLoading: boolean;
}

export interface NavItemProps {
  item: NavItemData;
  isActive: boolean;
  onPrefetch: (label: string) => Promise<void>;
}

export type PrefetchMap = Record<string, () => Promise<void> | void>;

export type IconMap = Record<string, JSX.Element>;
