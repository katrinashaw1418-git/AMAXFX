import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Shield, Calendar, DollarSign, AlertTriangle, Phone, MessageSquare, Building2, Coins, TrendingDown, Zap, Wallet as WalletIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FilterProduct {
  id: number;
  name: string;
  category: string;
  subCategory: string;
  investmentStrategy: string;
  targetNetIrr: string;
  term: string;
  structure: string;
  distributions: string;
  liquidity: string;
  minimumInvestment: string;
  riskProfile: string;
  returnType: string;
  isActive: boolean;
}

interface Wallet {
  id: number;
  currency: string;
  balance: string;
  availableBalance: string;
  displayName?: string;
}

interface FXRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: string;
}

export default function FundInvestments() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<FilterProduct | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);
  const [advisorMessage, setAdvisorMessage] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch filter products
  const { data: filterProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/filter-products'],
  });

  // Fetch wallets for currency selection
  const { data: wallets } = useQuery({
    queryKey: ['/api/wallets'],
  });

  // Fetch FX rates for currency conversion
  const { data: fxRates } = useQuery({
    queryKey: ['/api/fx-rates'],
  });

  // Investment mutation
  const investMutation = useMutation({
    mutationFn: async (data: { productId: number; amount: number; currency?: string }) => {
      return api.createInvestment(data);
    },
    onSuccess: () => {
      toast({
        title: 'Investment Created',
        description: 'Your investment has been successfully created.',
      });
      setSelectedProduct(null);
      setInvestmentAmount('');
      queryClient.invalidateQueries({ queryKey: ['/api/user-investments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/investment-performance'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Investment Failed',
        description: error.message || 'Failed to create investment',
        variant: 'destructive',
      });
    },
  });

  // Currency and conversion logic
  const selectedWallet = wallets?.find((w: any) => w.currency === selectedCurrency);
  const availableBalance = selectedWallet?.availableBalance ? parseFloat(selectedWallet.availableBalance) : 0;
  
  const currencySymbols: { [key: string]: string } = {
    'USD': '$',
    'CAD': 'C$',
    'EUR': '€',
    'GBP': '£',
    'AUD': 'A$',
    'HKD': 'HK$',
    'SGD': 'S$',
    'VND': '₫',
    'BTC': '₿',
    'ETH': 'Ξ',
    'USDT': '₮',
    'USDC': '◎'
  };

  const availableCurrencies = (wallets || []).map((wallet: any) => ({
    currency: wallet.currency,
    balance: parseFloat(wallet.availableBalance || '0'),
    displayName: wallet.displayName || wallet.currency,
    symbol: currencySymbols[wallet.currency] || wallet.currency
  })).filter((c: any) => c.balance > 0);

  const getUsdEquivalent = (amount: number, currency: string): number => {
    if (currency === 'USD') return amount;
    
    // Look for direct rate from currency to USD
    let rate = (fxRates || []).find((r: any) => r.baseCurrency === currency && r.targetCurrency === 'USD')?.rate;
    
    // If not found, look for USD to currency rate and invert it
    if (!rate) {
      const inverseRate = (fxRates || []).find((r: any) => r.baseCurrency === 'USD' && r.targetCurrency === currency)?.rate;
      if (inverseRate) {
        rate = 1 / parseFloat(inverseRate);
      }
    }
    
    return rate ? amount * parseFloat(rate) : amount;
  };

  // Filter products by category
  const filteredProducts = (filterProducts || []).filter((product: FilterProduct) => {
    if (selectedCategory === 'all') return true;
    return product.category === selectedCategory;
  });

  // Category options
  const categories = [
    { value: 'all', label: 'All Products', icon: Building2 },
    { value: 'real_estate', label: 'Real Estate', icon: Building2 },
    { value: 'corporate_credit', label: 'Corporate Credit', icon: TrendingUp },
    { value: 'digital_assets', label: 'Digital Assets', icon: Coins },
    { value: 'venture_capital', label: 'Venture Capital', icon: Zap },
  ];

  // Risk profile colors
  const riskProfileColors = {
    low: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  // Category icons
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'real_estate': return Building2;
      case 'corporate_credit': return TrendingUp;
      case 'digital_assets': return Coins;
      case 'venture_capital': return Zap;
      default: return Building2;
    }
  };

  const handleInvest = async () => {
    if (!selectedProduct || !investmentAmount) {
      toast({
        title: 'Missing Information',
        description: 'Please select a product and enter an investment amount.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(investmentAmount);
    const minInvestment = parseFloat(selectedProduct.minimumInvestment);
    
    if (amount < minInvestment) {
      toast({
        title: 'Investment Too Small',
        description: `Minimum investment is ${currencySymbols[selectedCurrency] || selectedCurrency}${minInvestment.toLocaleString()}`,
        variant: 'destructive',
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `Available balance: ${currencySymbols[selectedCurrency] || selectedCurrency}${availableBalance.toLocaleString()}`,
        variant: 'destructive',
      });
      return;
    }

    // Convert to USD if necessary
    const usdAmount = selectedCurrency === 'USD' ? amount : getUsdEquivalent(amount, selectedCurrency);

    await investMutation.mutateAsync({
      productId: selectedProduct.id,
      amount: usdAmount,
      currency: selectedCurrency
    });
  };

  if (productsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Funds</h1>
        <p className="text-gray-600">
          Explore and invest in our curated selection of investment products across multiple asset classes.
        </p>
      </div>

      {/* Available Capital Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="w-4 h-4" />
            Available Capital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {wallets?.filter((wallet: any) => parseFloat(wallet.availableBalance || '0') > 0).map((wallet: any) => (
              <div key={wallet.currency} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{wallet.displayName || wallet.currency}</span>
                  <span className="text-lg font-bold">
                    {currencySymbols[wallet.currency] || wallet.currency}
                    {parseFloat(wallet.availableBalance || '0').toLocaleString()}
                  </span>
                </div>
                {wallet.currency !== 'USD' && (
                  <p className="text-xs text-gray-500 mt-1">
                    ≈ US${getUsdEquivalent(parseFloat(wallet.availableBalance || '0'), wallet.currency).toLocaleString()}
                  </p>
                )}
              </div>
            )) || []}
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="mb-8">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={category.value} value={category.value} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Investment Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredProducts.map((product: FilterProduct) => {
          const CategoryIcon = getCategoryIcon(product.category);
          const minInvestment = parseFloat(product.minimumInvestment);
          
          return (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryIcon className="h-5 w-5 text-blue-600" />
                    <Badge variant="outline" className="text-xs">
                      {product.category.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <Badge className={riskProfileColors[product.riskProfile as keyof typeof riskProfileColors]}>
                    {product.riskProfile}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                <CardDescription className="text-sm line-clamp-3">
                  {product.investmentStrategy}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-xs text-gray-500">Target IRR</div>
                      <div className="font-semibold text-green-600">{product.targetNetIrr}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-xs text-gray-500">Term</div>
                      <div className="font-semibold">{product.term}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="text-xs text-gray-500">Min. Investment</div>
                      <div className="font-semibold">${minInvestment.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-xs text-gray-500">Structure</div>
                      <div className="font-semibold text-xs">{product.structure}</div>
                    </div>
                  </div>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      onClick={() => setSelectedProduct(product)}
                    >
                      Invest Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Investment Details</DialogTitle>
                      <DialogDescription>
                        {selectedProduct?.name} - Minimum investment: ${parseFloat(selectedProduct?.minimumInvestment || '0').toLocaleString()}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currency-select">Select Currency</Label>
                        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCurrencies.map((currency: any) => (
                              <SelectItem key={currency.currency} value={currency.currency}>
                                {currency.symbol} {currency.displayName} - Balance: {currency.symbol}{currency.balance.toLocaleString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="investment-amount">Investment Amount</Label>
                        <Input
                          id="investment-amount"
                          type="number"
                          placeholder="Enter amount"
                          value={investmentAmount}
                          onChange={(e) => setInvestmentAmount(e.target.value)}
                        />
                      </div>

                      {availableBalance > 0 && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
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
                            <Badge className={riskProfileColors[selectedProduct.riskProfile as keyof typeof riskProfileColors]}>
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
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products available</h3>
          <p className="text-gray-600">No investment products match your current filter criteria.</p>
        </div>
      )}

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
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setAdvisorModalOpen(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: 'Message Sent',
                    description: 'Your message has been sent to our wealth advisory team.',
                  });
                  setAdvisorMessage('');
                  setAdvisorModalOpen(false);
                }}
                className="flex-1"
                disabled={!advisorMessage.trim()}
              >
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Contact Advisor Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setAdvisorModalOpen(true)}
          className="rounded-full h-14 w-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="sm"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}