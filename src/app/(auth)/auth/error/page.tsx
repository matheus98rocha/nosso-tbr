"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ErrorContent() {
  const params = useSearchParams();
  const message = params.get("message") || "Ocorreu um erro inesperado.";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Erro no Login</h1>
      <p className="text-gray-700 mb-6 text-center max-w-md">{message}</p>
      <Link
        href="/"
        className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md"
      >
        Voltar para o login
      </Link>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
