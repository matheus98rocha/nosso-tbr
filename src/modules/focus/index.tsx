import { FocusTimer } from "./components/FocusTimer";

export function FocusScreen() {
  return (
    <main className="mx-auto w-full max-w-3xl">
      <header className="mb-8 border-b border-border pb-8 text-center md:mb-10 md:text-left">
        <h1 className="page-title">Foco de leitura</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:mx-0">
          Reserve um tempo só para ler. Defina a duração, inicie o cronômetro e
          deixe o aviso sonoro avisar quando terminar.
        </p>
      </header>

      <FocusTimer />

      <p className="mt-4 text-center text-sm text-muted-foreground">
        O aviso sonoro é emitido pelo navegador quando o cronômetro chega a zero.
      </p>
    </main>
  );
}
