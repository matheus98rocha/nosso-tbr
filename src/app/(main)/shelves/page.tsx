import ClienteShelves from "@/modules/shelves";
import { ArrowLeft, BookMarked } from "lucide-react";
import Link from "next/link";

export default function ShelvesPage() {
  return (
    <section className="w-full max-w-7xl">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Voltar
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookMarked className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Biblioteca pessoal
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Minhas Estantes
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Organize seus livros em coleções personalizadas
        </p>
      </div>

      <ClienteShelves />
    </section>
  );
}
