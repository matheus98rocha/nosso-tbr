"use client";

import { useState } from "react";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  const staleTime = 1000 * 60 * 2; // 2 minutos
  const gcTime = 1000 * 60 * 5; // mantém no cache por 5 min
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime,
            gcTime,

            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default ReactQueryProvider;
