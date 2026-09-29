import { NAV_ICON_MAP } from "../../constants/navIconMap";
import type { NavDestinationIconProps } from "../../types/navDestinationIcon.types";

export default function NavDestinationIcon({
  label,
  className = "size-[18px]",
}: NavDestinationIconProps) {
  const Icon = NAV_ICON_MAP[label];

  if (!Icon) return null;

  return <Icon className={className} aria-hidden />;
}
