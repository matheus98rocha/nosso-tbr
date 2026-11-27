import type { Metadata } from "next";

import { FocusScreen } from "@/modules/focus";

export const metadata: Metadata = {
  title: "Foco de leitura",
};

export default function FocusPage() {
  return <FocusScreen />;
}
