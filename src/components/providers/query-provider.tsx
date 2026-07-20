"use client";

import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";
import { useState } from "react";

/**
 * App-wide TanStack Query client. Server state for the interactive islands
 * (cart, wishlist, search, account) lives here; catalog data stays server-
 * rendered and never enters the query cache.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Per-user data changes often but not every render — a short window
        // dedupes bursts (e.g. drawer open + badge read) without going stale.
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Server Actions surface real failures (out of stock, auth); retrying
        // rarely helps and delays the error the UI needs to show.
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  // On the server always make a fresh client (no cross-request sharing); in the
  // browser reuse one so a Suspense/render restart doesn't drop the cache.
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
