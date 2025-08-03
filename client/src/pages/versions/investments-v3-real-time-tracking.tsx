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
import { TrendingUp, Building, CreditCard, Rocket, Bitcoin, DollarSign, Clock, Shield, Filter, X, ChevronDown, Phone, MessageCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InvestmentPerformanceChart } from "@/components/dashboard/investment-performance-chart";

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

export default function InvestmentsV3RealTimeTracking() {
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

  // Real-time investment tracking with 5-second refresh
  const { data: userInvestments, isLoading: investmentsLoading } = useQuery({
    queryKey: ["/api/user-investments"],
    queryFn: () => api.getUserInvestments(),
    refetchInterval: 5000, // Real-time tracking of investment changes
  });

  const { data: wallets } = useWallets();

  // Fetch FX rates for currency conversion
  const { data: fxRates } = useQuery({
    queryKey: ["/api/fx-rates"],
    queryFn: () => api.getFxRates(),
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
    },
  });

  // Investment creation mutation
  const investmentMutation = useMutation({
    mutationFn: async (data: { productId: number; amount: number; sourceCurrency: string; sourceAmount: number }) => {
      const response = await apiRequest("POST", "/api/investments", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Investment failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Investment Successful",
        description: "Your investment has been processed.",
      });
      setInvestModalOpen(false);
      setInvestmentAmount("");
      setSelectedProduct(null);
      // Invalidate related queries to trigger real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/user-investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investment-performance"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Investment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = () => {
    if (!userInvestments || userInvestments.length === 0) {
      return { totalInvested: 0, totalCurrent: 0, totalReturn: 0, returnPercent: 0 };
    }

    const totalInvested = userInvestments.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.investedAmount), 0);
    const totalCurrent = userInvestments.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.currentValue), 0);
    const totalReturn = totalCurrent - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return { totalInvested, totalCurrent, totalReturn, returnPercent };
  };

  const metrics = calculatePortfolioMetrics();

  // Currency utilities
  const currencySymbols = { USD: '$', CAD: 'C$', EUR: '€', GBP: '£', AUD: 'A$', SGD: 'S$', HKD: 'HK$' };
  const availableCurrencies = wallets?.filter((w: any) => parseFloat(w.balance) > 0) || [];
  const selectedWallet = wallets?.find((w: any) => w.currency === selectedCurrency);
  const availableBalance = selectedWallet ? parseFloat(selectedWallet.balance) : 0;

  const getUsdEquivalent = (amount: number, currency: string) => {
    if (currency === 'USD') return amount;
    const rate = fxRates?.find((r: any) => r.baseCurrency === currency && r.targetCurrency === 'USD');
    return rate ? amount * parseFloat(rate.exchangeRate) : amount;
  };

  const clearFilters = () => setFilters({});
  const hasActiveFilters = Object.keys(filters).some(key => filters[key as keyof typeof filters]);

  const handleInvestment = () => {
    if (!selectedProduct || !investmentAmount) return;
    
    const amount = parseFloat(investmentAmount);
    const sourceAmount = amount; // For now, assume 1:1 conversion
    
    investmentMutation.mutate({
      productId: selectedProduct.id,
      amount,
      sourceCurrency: selectedCurrency,
      sourceAmount,
    });
  };

  const handleAdvisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorMessage.trim()) return;
    advisorMutation.mutate({ message: advisorMessage });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Version Banner */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-900">Investments v3.0 - Real-Time Tracking</h3>
            <p className="text-sm text-green-700">
              Live investment performance updates with Bitcoin market-based calculations
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 text-green-600 animate-spin" />
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Live Updates
            </Badge>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Investment Products</h1>
        <p className="text-muted-foreground">
          Explore and invest in our curated selection of cross-border wealth management products
        </p>
      </div>

      {/* Portfolio Summary Cards */}
      {userInvestments && userInvestments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="flex flex-col h-32">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-medium text-gray-500">Total Invested</h3>
                <DollarSign className="w-3 h-3 text-secondary" />
              </div>
              <div className="flex flex-col justify-end h-16">
                <div className="flex items-end h-6">
                  <p className="text-lg font-bold text-blue-600 whitespace-nowrap overflow-hidden text-ellipsis w-full leading-none">
                    ${metrics.totalInvested.toLocaleString()}
                  </p>
                </div>
                <div className="h-4"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-col h-32">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-medium text-gray-500">Current Value</h3>
                <TrendingUp className="w-3 h-3 text-secondary" />
              </div>
              <div className="flex flex-col justify-end h-16">
                <div className="flex items-end h-6">
                  <p className="text-lg font-bold text-blue-600 whitespace-nowrap overflow-hidden text-ellipsis w-full leading-none">
                    ${metrics.totalCurrent.toLocaleString()}
                  </p>
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
                  <span className={`text-xs ${metrics.returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.returnPercent >= 0 ? '+' : ''}{metrics.returnPercent.toFixed(2)}%
                  </span>
                </div>
                <TrendingUp className="w-3 h-3 text-secondary" />
              </div>
              <div className="flex flex-col justify-end h-16">
                <div className="flex items-end h-6">
                  <p className={`text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full leading-none ${metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${metrics.totalReturn.toLocaleString()}
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
                    {availableCurrencies.map((currency: any) => (
                      <SelectItem key={currency.currency} value={currency.currency}>
                        <span className="font-medium">{currency.currency}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col justify-end h-16">
                <div className="flex items-end h-6">
                  <p className="text-lg font-bold text-green-600 whitespace-nowrap overflow-hidden text-ellipsis w-full leading-none">
                    {currencySymbols[selectedCurrency] || selectedCurrency}{availableBalance.toLocaleString()}
                  </p>
                </div>
                <div className="h-4 flex items-center">
                  {selectedCurrency !== 'USD' && (
                    <span className="text-xs text-gray-600">
                      US${getUsdEquivalent(availableBalance, selectedCurrency).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-Time Performance Chart */}
      {userInvestments && userInvestments.length > 0 && (
        <div className="relative">
          <InvestmentPerformanceChart />
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              Real-time updates
            </Badge>
          </div>
        </div>
      )}

      {/* Performance Methodology Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5" />
            Performance Calculation Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-semibold text-orange-900">Market-Based Returns</h4>
              <p className="text-sm text-orange-700 mt-1">
                Bitcoin Tracker Fund uses 60% annualized market-based historical performance
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900">Traditional Midpoint IRR</h4>
              <p className="text-sm text-blue-700 mt-1">
                Other assets use conservative midpoint IRR calculations (11-18% range)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product: any) => {
          const CategoryIcon = categoryIcons[product.category as keyof typeof categoryIcons];
          const minimumInvestment = parseFloat(product.minimumInvestment);
          
          return (
            <Card key={product.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardContent className="p-6 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CategoryIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{categoryLabels[product.category as keyof typeof categoryLabels]}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-grow">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Target IRR</p>
                      <p className="font-semibold">{product.targetNetIrr}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Min Investment</p>
                      <p className="font-semibold">${minimumInvestment.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${riskProfileColors[product.riskProfile as keyof typeof riskProfileColors]}`}
                    >
                      {product.riskProfile?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${returnTypeColors[product.returnType as keyof typeof returnTypeColors]}`}
                    >
                      {product.returnType?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-3 flex-grow">
                    {product.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Dialog open={investModalOpen && selectedProduct?.id === product.id} 
                          onOpenChange={(open) => {
                            setInvestModalOpen(open);
                            if (!open) setSelectedProduct(null);
                          }}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => setSelectedProduct(product)}
                        disabled={availableBalance < minimumInvestment}
                      >
                        {availableBalance < minimumInvestment ? 'Insufficient Balance' : 'Invest Now'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invest in {product.name}</DialogTitle>
                        <DialogDescription>
                          Enter your investment amount and confirm the transaction.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Investment Amount ({selectedCurrency})</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder={`Minimum ${currencySymbols[selectedCurrency] || selectedCurrency}${minimumInvestment.toLocaleString()}`}
                            value={investmentAmount}
                            onChange={(e) => setInvestmentAmount(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Available: {currencySymbols[selectedCurrency] || selectedCurrency}{availableBalance.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setInvestModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleInvestment}
                            disabled={!investmentAmount || parseFloat(investmentAmount) < minimumInvestment || investmentMutation.isPending}
                          >
                            {investmentMutation.isPending ? "Processing..." : "Confirm Investment"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contact Advisor Floating Box */}
      {showAdvisorBox && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="w-80 shadow-lg border-2 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Wealth Planner</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAdvisorBox(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Need guidance on investment selection? Contact your wealth planner.
              </p>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-xs">
                  <Phone className="h-3 w-3" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <Dialog open={advisorModalOpen} onOpenChange={setAdvisorModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 text-xs">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contact Your Wealth Planner</DialogTitle>
                      <DialogDescription>
                        Send a message about investment guidance. Response within 24 hours.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdvisorSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Which investment products would you recommend for my portfolio?"
                          value={advisorMessage}
                          onChange={(e) => setAdvisorMessage(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setAdvisorModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={!advisorMessage.trim() || advisorMutation.isPending}
                        >
                          {advisorMutation.isPending ? "Sending..." : "Send Message"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}