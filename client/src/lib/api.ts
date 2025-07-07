import { apiRequest } from "./queryClient";

export const api = {
  // User
  getCurrentUser: () => fetch("/api/user").then(res => res.json()),
  
  // Portfolio
  getPortfolio: () => fetch("/api/portfolio").then(res => res.json()),
  
  // Wallets
  getWallets: () => fetch("/api/wallets").then(res => res.json()),
  
  // Transactions
  getTransactions: (limit?: number) => {
    const url = limit ? `/api/transactions?limit=${limit}` : "/api/transactions";
    return fetch(url).then(res => res.json());
  },
  
  // FX Rates
  getFxRates: () => fetch("/api/fx-rates").then(res => res.json()),
  getFxRate: (base: string, target: string) => 
    fetch(`/api/fx-rates/${base}/${target}`).then(res => res.json()),
  
  // AI Recommendations
  getAiRecommendations: () => fetch("/api/ai-recommendations").then(res => res.json()),
  markRecommendationAsRead: (id: number) => 
    apiRequest("PATCH", `/api/ai-recommendations/${id}/read`),
  
  // Transactions
  createFxExchange: (data: { fromCurrency: string; toCurrency: string; amount: number }) =>
    apiRequest("POST", "/api/fx-exchange", data),
  
  createDeposit: (data: { currency: string; amount: number; description?: string }) =>
    apiRequest("POST", "/api/deposit", data),
  
  createWithdrawal: (data: { currency: string; amount: number; description?: string }) =>
    apiRequest("POST", "/api/withdraw", data),

  // Investment Products
  getInvestmentProducts: (filters?: { category?: string; riskProfile?: string; liquidity?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.riskProfile) params.append('riskProfile', filters.riskProfile);
    if (filters?.liquidity) params.append('liquidity', filters.liquidity);
    const queryString = params.toString();
    return fetch(`/api/investment-products${queryString ? `?${queryString}` : ''}`).then(res => res.json());
  },

  getInvestmentProduct: (id: number) => 
    fetch(`/api/investment-products/${id}`).then(res => res.json()),

  getUserInvestments: () => 
    fetch("/api/user-investments").then(res => res.json()),

  createInvestment: (data: { productId: number; amount: number }) =>
    apiRequest("POST", "/api/investments", data),
};
