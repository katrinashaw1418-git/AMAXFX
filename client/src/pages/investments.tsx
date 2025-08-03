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
import { InvestmentPerformanceChart } from "@/components/dashboard/investment-performance-chart";
import { InvestmentBreakdownDetail } from "@/components/dashboard/investment-breakdown-detail";

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
    refetchInterval: 1000, // Refresh every 1 second for immediate Capital Invested updates
    staleTime: 0, // Always consider data stale to force fresh requests
  });

  const { data: wallets } = useWallets();

  // Fetch FX rates for currency conversion
  const { data: fxRates } = useQuery({
    queryKey: ["/api/fx-rates"],
    queryFn: () => api.getFxRates(),
  });

  const investMutation = useMutation({
    mutationFn: (data: { productId: number; amount: number; sourceCurrency?: string; sourceAmount?: number }) => 
      api.createInvestment(data),
    onSuccess: (response) => {
      const newInvestmentAmount = response?.investment?.investedAmount || response?.investedAmount || 0;
      toast({
        title: "Investment Created", 
        description: `Successfully invested $${parseFloat(newInvestmentAmount).toLocaleString()}. Capital Invested will update automatically using the formula: Existing Capital + New Investment.`,
      });
      
      // Invalidate ALL queries to trigger Capital Invested formula recalculation
      queryClient.invalidateQueries({ queryKey: ["/api/user-investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/allocation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investment-breakdown"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investment-performance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investment-products"] });
      
      // Force immediate refresh for real-time Capital Invested updates
      queryClient.refetchQueries();
      
      console.log('Capital Invested Formula Triggered:', {
        newInvestment: newInvestmentAmount,
        formula: 'Capital Invested = Existing Capital + New Investment Amount',
        action: 'Investment created - triggering automatic recalculation',
        timestamp: new Date().toISOString()
      });
      
      // Ultra-aggressive immediate refresh for Capital Invested display
      queryClient.invalidateQueries();
      queryClient.refetchQueries();
      
      setTimeout(() => {
        queryClient.invalidateQueries();
        queryClient.refetchQueries();
        console.log('URGENT: Capital Invested should update now - check if amount increased!');
      }, 50);
      
      setTimeout(() => {
        queryClient.invalidateQueries();
        queryClient.refetchQueries();
      }, 200);
      
      setTimeout(() => {
        queryClient.invalidateQueries();
        queryClient.refetchQueries();
      }, 500);
      
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

    // Create investment with automated Capital Invested formula update
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

  // Use investment performance API for accurate calculations instead of user-investments currentValue
  const { data: investmentPerformance } = useQuery({
    queryKey: ["/api/investment-performance", { timeframe: "1Y" }],
    queryFn: () => api.getInvestmentPerformance({ timeframe: "1Y" }),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Calculate totals using consistent midpoint IRR methodology
  const totalInvested = userInvestments?.reduce((sum: number, inv: any) => sum + parseFloat(inv.investedAmount), 0) || 0;
  const totalCurrentValue = investmentPerformance ? parseFloat(investmentPerformance.currentValue) : 0;
  const totalReturn = investmentPerformance ? parseFloat(investmentPerformance.totalReturn) : 0;
  const totalReturnPercent = investmentPerformance ? parseFloat(investmentPerformance.totalReturnPercent) : 0;

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
          <h1 className="text-2xl font-bold">Investment Performance</h1>
          <p className="text-gray-600">Track your investment portfolio performance and detailed breakdowns</p>
        </div>
      </div>

      {/* Performance by Period Chart */}
      {userInvestments && userInvestments.length > 0 && (
        <InvestmentPerformanceChart />
      )}

      {/* Detailed Product Breakdown */}
      {userInvestments && userInvestments.length > 0 && (
        <div className="mt-6">
          <InvestmentBreakdownDetail />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter Products
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={filters.category || "all"} onValueChange={(value) => 
                setFilters({...filters, category: value === "all" ? undefined : value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="corporate_credit">Corporate Credit</SelectItem>
                  <SelectItem value="venture_capital">Venture Capital</SelectItem>
                  <SelectItem value="digital_assets">Digital Assets</SelectItem>
                  <SelectItem value="cash_deposit">Cash Deposits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Risk Profile</Label>
              <Select value={filters.riskProfile || "all"} onValueChange={(value) => 
                setFilters({...filters, riskProfile: value === "all" ? undefined : value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All risk levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="very_high">Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Liquidity</Label>
              <Select value={filters.liquidity || "all"} onValueChange={(value) => 
                setFilters({...filters, liquidity: value === "all" ? undefined : value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All liquidity types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="locked">Locked Term</SelectItem>
                  <SelectItem value="illiquid">Long-term Lock-in</SelectItem>
                </SelectContent>
              </Select>
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
                      <CategoryIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {categoryLabels[product.category as keyof typeof categoryLabels]}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Target IRR:</span>
                    <span className="font-semibold text-green-600 text-right">{product.targetNetIrr}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Term:</span>
                    <span className="font-medium text-right">{product.term}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Min. Investment:</span>
                    <span className="font-medium text-right">${minimumInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Capital Invested:</span>
                    <span className="font-medium text-blue-600 text-right">${userInvestments?.filter((inv: any) => inv.productId === product.id).reduce((sum: number, inv: any) => sum + parseFloat(inv.investedAmount), 0).toLocaleString() || '0'}</span>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <Badge className={riskProfileColors[product.riskProfile as keyof typeof riskProfileColors]}>
                    {product.riskProfile}
                  </Badge>
                  <Badge className={returnTypeColors[product.returnType as keyof typeof returnTypeColors]}>
                    {product.returnType.replace('_', ' ')}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-6 line-clamp-3 flex-grow">
                  {product.investmentStrategy}
                </p>

                <div className="space-y-2 mt-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{product.name}</DialogTitle>
                      <DialogDescription>
                        {categoryLabels[product.category as keyof typeof categoryLabels]} Investment Product
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Investment Strategy</h4>
                        <p className="text-sm text-muted-foreground">{product.investmentStrategy}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Key Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Target Net IRR:</span>
                              <span className="font-semibold text-green-600">{product.targetNetIrr}</span>
                            </div>
                            {product.grossIrr && (
                              <div className="flex justify-between">
                                <span>Gross IRR:</span>
                                <span className="font-semibold">{product.grossIrr}</span>
                              </div>
                            )}
                            {product.moic && (
                              <div className="flex justify-between">
                                <span>MOIC:</span>
                                <span className="font-semibold">{product.moic}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Term:</span>
                              <span className="font-medium">{product.term}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Structure:</span>
                              <span className="font-medium">{product.structure}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Distributions:</span>
                              <span className="font-medium">{product.distributions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Liquidity:</span>
                              <span className="font-medium">{product.liquidity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Min. Investment:</span>
                              <span className="font-medium">${minimumInvestment.toLocaleString()}</span>
                            </div>
                            {product.lvr && (
                              <div className="flex justify-between">
                                <span>LVR:</span>
                                <span className="font-medium">{product.lvr}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                  </Dialog>

                  <Button 
                    className="w-full"
                    onClick={() => {
                      setSelectedProduct(product);
                      setInvestModalOpen(true);
                    }}
                  >
                    Invest Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Investment Modal */}
      <Dialog open={investModalOpen} onOpenChange={setInvestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invest in {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Enter your investment amount below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Investment Amount ({selectedCurrency})</Label>
              <Input
                id="amount"
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                placeholder={`Enter amount in ${selectedCurrency}`}
              />
              {selectedProduct && (
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Minimum: ${parseFloat(selectedProduct.minimumInvestment).toLocaleString()} USD
                  </p>
                  <p className="text-xs font-medium text-blue-600">
                    Capital Invested: ${userInvestments?.filter((inv: any) => inv.productId === selectedProduct.id).reduce((sum: number, inv: any) => sum + parseFloat(inv.investedAmount), 0).toLocaleString() || '0'} USD
                  </p>
                  <p className="text-xs font-medium text-green-600">
                    Available to Invest: {currencySymbols[selectedCurrency] || selectedCurrency}{availableBalance.toLocaleString()}
                    {selectedCurrency !== 'USD' && ` (≈ US$${getUsdEquivalent(availableBalance, selectedCurrency).toLocaleString()})`}
                  </p>

                  {selectedCurrency !== 'USD' && investmentAmount && (
                    <p className="text-xs text-orange-600">
                      Will convert {currencySymbols[selectedCurrency] || selectedCurrency}{parseFloat(investmentAmount).toLocaleString()} → US$${getUsdEquivalent(parseFloat(investmentAmount), selectedCurrency).toLocaleString()} at current exchange rate
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {selectedProduct && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Investment Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Target IRR:</span>
                    <span className="font-semibold text-green-600">{selectedProduct.targetNetIrr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Term:</span>
                    <span className="font-medium">{selectedProduct.term}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Profile:</span>
                    <Badge className={riskProfileColors[selectedProduct.riskProfile as keyof typeof riskProfileColors]} size="sm">
                      {selectedProduct.riskProfile}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleInvest} 
              disabled={investMutation.isPending}
              className="w-full"
            >
              {investMutation.isPending ? "Processing..." : "Confirm Investment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advisor Contact Modal */}
      <Dialog open={advisorModalOpen} onOpenChange={setAdvisorModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Wealth Advisory Team</DialogTitle>
            <DialogDescription>
              Send a message to our wealth advisory team. We'll respond within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Phone:</strong> +61 3 9654 1000
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="advisor-message">Your Message</Label>
              <Textarea
                id="advisor-message"
                placeholder="How can our wealth advisory team help you?"
                value={advisorMessage}
                onChange={(e) => setAdvisorMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setAdvisorModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => advisorMutation.mutate({ message: advisorMessage })}
                disabled={advisorMutation.isPending || !advisorMessage.trim()}
              >
                {advisorMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}