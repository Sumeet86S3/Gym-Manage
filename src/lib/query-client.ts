import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: (_failureCount, error) => {
          const status =
            error && typeof error === "object" && "status" in error ? error.status : null;
          if (status === 0) return false;
          return typeof navigator === "undefined" || navigator.onLine;
        },
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  });
}
