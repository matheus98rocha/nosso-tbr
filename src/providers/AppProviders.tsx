// providers/AppProviders.tsx
"use client";

import React from "react";
import ReactQueryProvider from "@/providers/ReactQuery.provider";
import { Toaster } from "@/components/ui/sonner";
import { FinishedBookShareHost } from "@/modules/finishedBookShare";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      {children}
      <FinishedBookShareHost />
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
