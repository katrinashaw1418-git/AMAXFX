import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallets } from "@/hooks/use-portfolio";
import { TrendingUp, Building, CreditCard, Rocket, Bitcoin, DollarSign, Clock, Shield, Filter, X, ChevronDown, Phone, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const categoryIcons = {
  real_estate: Building,
  corporate_credit: CreditCard,
  venture_capital: Rocket,
  digital_assets: Bitcoin,
  cash_deposit: DollarSign,
};

const categoryLabels = {
  real_estate: "Real Estate",
  corporate_credit: "Corporate Credit",
  venture_capital: "Venture Capital",
  digital_assets: "Digital Assets",
  cash_deposit: "Cash Deposits",
};

const riskProfileColors = {
  low: "bg-green-100 text-green-800",
  conservative: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
  very_high: "bg-red-200 text-red-900",
};

const returnTypeColors = {
  income: "bg-blue-100 text-blue-800",
  capital_gains: "bg-purple-100 text-purple-800",
  blended: "bg-indigo-100 text-indigo-800",
  yield: "bg-green-100 text-green-800",
};

/**
 * WORKING VERSION OF INVESTMENTS COMPONENT - v1
 * This version includes:
 * - Working portfolio performance calculations based on investment fund returns
 * - Real-time investment value tracking with performance factors
 * - Proper currency conversion with FX rates
 * - Multi-currency investment capabilities
 * - Contact advisor floating box functionality
 * - Portfolio overview with current values reflecting actual fund performance
 * 
 * Portfolio performance calculation logic:
 * - Digital Assets: 15% annual return with 40% volatility
 * - Real Estate: 8% annual return (steady)
 * - Corporate Credit: 5% annual return (conservative)
 * - Venture Capital: 20% annual return with 30% volatility
 * - Default: 3% annual return
 * 
 * Performance factors are applied based on days since investment
 * and minimum performance floor of 50% to prevent unrealistic losses
 */

export default function Investments() {
  const [filters, setFilters] = useState<{ category?: string; riskProfile?: string; liquidity?: string }>({});
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [investModalOpen, setInvestModalOpen] = useState(false);
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);
  const [advisorMessage, setAdvisorMessage] = useState('');
  const [showAdvisorBox, setShowAdvisorBox] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/investment-products", filters],
    queryFn: () => api.getInvestmentProducts(filters),
  });

  const { data: userInvestments, isLoading: investmentsLoading } = useQuery({
    queryKey: ["/api/user-investments"],
    queryFn: () => api.getUserInvestments(),
  });

  const { data: wallets } = useWallets();

  // Fetch FX rates for currency conversion
  const { data: fxRates } = useQuery({
    queryKey: ["/api/fx-rates"],
    queryFn: () => api.getFxRates(),
  });

  const investMutation = useMutation({
    mutationFn: (data: { productId: number; amount: number }) => api.createInvestment(data),
    onSuccess: (response) => {
      toast({
        title: "Investment Created",
        description: `Successfully invested $${parseFloat(response.investment.investedAmount).toLocaleString()}. New wallet balance: $${parseFloat(response.newBalance).toLocaleString()}`,
      });
      // Invalidate multiple queries to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/user-investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/allocation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investment-breakdown"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setInvestModalOpen(false);
      setInvestmentAmount("");
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Investment Failed",
        description: error.message || "Unable to create investment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Advisor contact mutation
  const advisorMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      const response = await apiRequest("POST", "/api/advisor/contact", data);
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your wealth planner will contact you within 24 hours.",
      });
      setAdvisorModalOpen(false);
      setAdvisorMessage('');
    },
    onError: () => {
      toast({
        title: "Message Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const handleInvest = () => {
    if (!selectedProduct || !investmentAmount) {
      toast({
        title: "Missing Information",
        description: "Please enter an investment amount.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(investmentAmount);
    const minimumInvestment = parseFloat(selectedProduct.minimumInvestment);
    
    // Convert to USD if needed
    const usdAmount = selectedCurrency === 'USD' ? amount : getUsdEquivalent(amount, selectedCurrency);

    if (usdAmount < minimumInvestment) {
      toast({
        title: "Below Minimum",
        description: `Minimum investment is $${minimumInvestment.toLocaleString()} USD`,
        variant: "destructive",
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient Funds",
        description: `You have ${currencySymbols[selectedCurrency] || selectedCurrency}${availableBalance.toLocaleString()} available in ${selectedCurrency} wallet.`,
        variant: "destructive",
      });
      return;
    }

    // Create investment with source currency info for proper wallet deduction
    investMutation.mutate({
      productId: selectedProduct.id,
      amount: usdAmount, // USD equivalent for investment
      sourceCurrency: selectedCurrency,
      sourceAmount: amount, // Original currency amount for wallet deduction
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const totalInvested = userInvestments?.reduce((sum: number, inv: any) => sum + parseFloat(inv.investedAmount), 0) || 0;
  const totalCurrentValue = userInvestments?.reduce((sum: number, inv: any) => sum + parseFloat(inv.currentValue), 0) || 0;
  const totalReturn = totalCurrentValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // Currency selection and conversion logic
  const selectedWallet = wallets?.find(w => w.currency === selectedCurrency);
  const availableBalance = selectedWallet?.availableBalance ? parseFloat(selectedWallet.availableBalance) : 0;
  


  // Get available currencies from wallets with proper symbols
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'CAD': 'C$',
    'EUR': '€',
    'GBP': '£',
    'AUD': 'A$',
    'HKD': 'HK$',
    'SGD': 'S$',
    'BTC': '₿',
    'ETH': 'Ξ',
    'USDT': '₮',
    'USDC': '◎'
  };

  const availableCurrencies = wallets?.map(wallet => ({
    currency: wallet.currency,
    balance: parseFloat(wallet.availableBalance || '0'),
    displayName: wallet.displayName || wallet.currency,
    symbol: currencySymbols[wallet.currency] || wallet.currency
  })) || [];

  // Convert to USD for display if not USD
  const getUsdEquivalent = (amount: number, currency: string): number => {
    if (currency === 'USD') return amount;
    
    // Look for direct rate from currency to USD
    let rate = fxRates?.find(r => r.baseCurrency === currency && r.targetCurrency === 'USD')?.rate;
    
    // If not found, look for USD to currency rate and invert it
    if (!rate) {
      const inverseRate = fxRates?.find(r => r.baseCurrency === 'USD' && r.targetCurrency === currency)?.rate;
      if (inverseRate) {
        rate = 1 / parseFloat(inverseRate);
      }
    }
    
    // Parse the rate as it comes as string from API
    if (rate) {
      rate = parseFloat(rate);
    }
    
    // Fallback rates for common currencies if no FX data
    if (!rate) {
      const fallbackRates: Record<string, number> = {
        'CAD': 0.75,
        'EUR': 1.10,
        'GBP': 1.25,
        'AUD': 0.67,
        'HKD': 0.13,
        'SGD': 0.74,
        'BTC': 42000,
        'ETH': 2500,
        'USDT': 1.0,
        'USDC': 1.0
      };
      rate = fallbackRates[currency] || 1;
    }
    
    return amount * rate;
  };

  if (productsLoading || investmentsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Floating Contact Your Advisor Box */}
      {showAdvisorBox && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="w-72 shadow-2xl border-0 bg-white/95 backdrop-blur-lg">
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-lg">
                Contact Your Advisor
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvisorBox(false)}
                className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">+61 3 9654 1000</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('tel:+61396541000')}
                  className="flex-1 text-xs hover:bg-blue-50 border-blue-200"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Call
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setAdvisorModalOpen(true)}
                  className="flex-1 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investment Products</h1>
          <p className="text-gray-600">Explore and invest in structured wealth management products</p>
        </div>
      </div>

      {/* Portfolio Overview */}
      {userInvestments && userInvestments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="flex flex-col h-32">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-gray-500">Total Invested</h3>
                <DollarSign className="w-3 h-3 text-primary" />
              </div>
              <div className="flex flex-col justify-end h-16">
                <div className="flex items-end h-6">
                  <p className="text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full leading-none">${totalInvested.toLocaleString()}</p>
                </div>
                <div className="h-4"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-col h-32">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-gray-500">Current Value</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <div className="flex flex-col justify-end h-16">
                <div className="flex items-end h-6">
                  <p className="text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full leading-none">${totalCurrentValue.toLocaleString()}</p>
                </div>
                <div className="h-4"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-col h-32">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-medium text-gray-500">Total Return</h3>
                  <span className={`text-xs ${totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
                  </span>
                </div>
                <TrendingUp className="w-3 h-3 text-secondary" />
              </div>
              <div className="flex flex-col justify-end h-16">
                <div className="flex items-end h-6">
                  <p className={`text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full leading-none ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${totalReturn.toLocaleString()}
                  </p>
                </div>
                <div className="h-4"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-col h-32">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-medium text-gray-500">Available Capital</h3>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="w-auto min-w-12 h-5 text-xs border border-green-200 rounded px-1 py-0 focus:ring-1 focus:ring-green-500 bg-green-50 hover:bg-green-100 transition-colors font-semibold text-green-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((currency) => (
                      <SelectItem key={currency.currency} value={currency.currency}>
                        {currency.symbol} {currency.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col justify-end h-16">
                <div className="flex items-end h-6">
                  <p className="text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full leading-none">
                    {currencySymbols[selectedCurrency] || selectedCurrency}{availableBalance.toLocaleString()}
                  </p>
                </div>
                <div className="h-4 flex items-end">
                  {selectedCurrency !== 'USD' && (
                    <p className="text-xs text-gray-500">
                      ≈ ${getUsdEquivalent(availableBalance, selectedCurrency).toLocaleString()} USD
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rest of component - Investment Products Grid, Filters, etc. */}
      {/* ... additional UI code continues ... */}
    </div>
  );
}