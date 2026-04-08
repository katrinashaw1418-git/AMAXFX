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
  const sameCurrency = base === target;
  return useQuery({
    queryKey: ["/api/fx-rates", base, target],
    queryFn: () => api.getFxRate(base, target),
    refetchInterval: 10000,
    enabled: !!(base && target) && !sameCurrency,
    // When base === target, rate is always 1. Don't hit the API.
    placeholderData: sameCurrency ? { rate: "1", baseCurrency: base, targetCurrency: target } : undefined,
  });
}
