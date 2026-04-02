import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "size-12 text-base rounded-xl",
  md: "size-16 text-lg rounded-2xl",
  lg: "size-[4.5rem] text-xl rounded-2xl",
} as const;

export type ProfileInitialsAvatarSize = keyof typeof sizeClasses;

type ProfileInitialsAvatarProps = {
  initials: string;
  size?: ProfileInitialsAvatarSize;
  className?: string;
};

export function ProfileInitialsAvatar({
  initials,
  size = "md",
  className,
}: ProfileInitialsAvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-violet-600 font-semibold tracking-tight text-white shadow-sm",
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
