// providers/AppProviders.tsx
"use client";

import React from "react";
import ReactQueryProvider from "@/providers/ReactQuery.provider";
import { Toaster } from "@/components/ui/sonner";
import NextNProgress from "nextjs-progressbar";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <NextNProgress />
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
