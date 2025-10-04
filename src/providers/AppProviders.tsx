// providers/AppProviders.tsx
"use client";

import React from "react";
import ReactQueryProvider from "@/providers/ReactQuery.provider";
import { Toaster } from "@/components/ui/sonner";
import { ProgressLoader } from "nextjs-progressloader";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <ProgressLoader />
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "rounded-md shadow-lg font-semibold",
          },
        }}
      />
    </ReactQueryProvider>
  );
}
