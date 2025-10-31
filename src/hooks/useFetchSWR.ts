"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => r.json());

export function useFetchSWR<T>(url: string) {
  const { data, error, isLoading, mutate } = useSWR<T>(url, fetcher, {
    revalidateOnFocus: true,
  });

  return {
    data,
    error,
    loading: isLoading,
    refresh: mutate,
  };
}
