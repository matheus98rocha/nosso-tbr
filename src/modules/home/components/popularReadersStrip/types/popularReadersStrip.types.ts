import type { PopularReader } from "@/modules/home/types";

export type PopularReaderCardProps = {
  reader: PopularReader;
  isToggleBusy: boolean;
  onFollow: () => void;
};

export type PopularReadersStripProps = {
  readers: PopularReader[];
  isLoading: boolean;
  isTogglePending: boolean;
  pendingUserId: string | null;
  onFollow: (readerId: string) => void;
  onHide: () => void;
};

export type PopularReadersRevealProps = {
  onShow: () => void;
};
