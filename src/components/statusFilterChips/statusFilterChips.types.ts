import { LucideIcon } from "lucide-react";
import { Status } from "@/types/books.types";

export interface StatusChipConfig {
  status: Status;
  label: string;
  Icon: LucideIcon;
  activeClass: string;
  hoverClass: string;
}

export interface StatusFilterChipsProps {
  activeStatuses: Status[];
  onToggle: (status: Status) => void;
}
