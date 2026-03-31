import Link from "next/link";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import type { LinkButtonProps } from "./types/linkButton.types";

function LinkButtonComponent({ href, label }: LinkButtonProps) {
  return (
    <Link href={href} prefetch>
      <Button type="button">{label}</Button>
    </Link>
  );
}

export const LinkButton = memo(LinkButtonComponent);
