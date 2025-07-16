import ClienteShelves from "@/modules/shelves";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ShelvesPage() {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        {/* Go back */}
        <Link href="/" className="flex items-center justify-start gap-2">
          <ArrowLeft /> Voltar
        </Link>
      </div>

      {/* title page */}
      <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance mb-4">
        Minhas Estantes
      </h1>

      {/* Client code */}
      <ClienteShelves />
    </div>
  );
}
