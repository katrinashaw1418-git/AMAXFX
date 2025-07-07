import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useFxRates() {
  return useQuery({
    queryKey: ["/api/fx-rates"],
    queryFn: api.getFxRates,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useFxRate(base: string, target: string) {
  return useQuery({
    queryKey: ["/api/fx-rates", base, target],
    queryFn: () => api.getFxRate(base, target),
    refetchInterval: 10000,
    enabled: !!(base && target),
  });
}
