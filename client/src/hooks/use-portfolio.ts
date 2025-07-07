import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePortfolio() {
  return useQuery({
    queryKey: ["/api/portfolio"],
    queryFn: api.getPortfolio,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useWallets() {
  return useQuery({
    queryKey: ["/api/wallets"],
    queryFn: api.getWallets,
    refetchInterval: 30000,
  });
}

export function useTransactions(limit?: number) {
  return useQuery({
    queryKey: ["/api/transactions", limit],
    queryFn: () => api.getTransactions(limit),
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useAiRecommendations() {
  return useQuery({
    queryKey: ["/api/ai-recommendations"],
    queryFn: api.getAiRecommendations,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}
