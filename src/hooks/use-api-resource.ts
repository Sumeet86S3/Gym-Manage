import { useCallback, useEffect, useMemo, type SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export function useApiResource<T>(path: string, fallback: T) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["api", path] as const, [path]);
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => api<T>(path, { signal }),
    placeholderData: (previous) => previous,
  });

  const data = query.data ?? fallback;
  const { refetch } = query;
  const errorMessage = query.error instanceof Error ? query.error.message : "";

  useEffect(() => {
    if (errorMessage) toast.error("Unable to load data", { description: errorMessage });
  }, [errorMessage]);

  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const setData = useCallback(
    (next: SetStateAction<T>) => {
      queryClient.setQueryData<T>(queryKey, (current) => {
        const value = current ?? data ?? fallback;
        return typeof next === "function" ? (next as (previous: T) => T)(value) : next;
      });
    },
    [data, fallback, queryClient, queryKey],
  );

  return {
    data,
    setData,
    loading: query.isLoading,
    failed: query.isError,
    error: errorMessage,
    reload,
  };
}
