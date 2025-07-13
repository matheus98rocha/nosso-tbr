import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} prefetch>
      <Button>{label}</Button>
    </Link>
  );
}
