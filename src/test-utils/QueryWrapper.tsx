// src/test-utils/QueryWrapper.tsx

import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Crie uma nova instância do QueryClient para cada teste (ou uma reusável)
const testQueryClient = new QueryClient({
  // Configurações padrão para evitar tentativas de retry durante testes
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

export const TestQueryWrapper = ({ children }: { children: ReactNode }) => {
  // Use o QueryClientProvider para fornecer o client necessário
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};
