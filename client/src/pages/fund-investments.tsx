import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Shield, Calendar, DollarSign, Building2, Coins, Zap, Wallet as WalletIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<FilterProduct | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: filterProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/filter-products'],
    queryFn: () => api.getFilterProducts(),
  });

  const { data: wallets } = useQuery({
    queryKey: ['/api/wallets'],
    queryFn: () => api.getWallets(),
  });

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
  const selectedWallet = (wallets || []).find((w: any) => w.currency === selectedCurrency);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fund Investments</h1>
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
            {(wallets || []).filter((wallet: any) => parseFloat(wallet.availableBalance || '0') > 0).map((wallet: any) => (
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
            ))}
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
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-xs text-gray-500">Min. Investment</div>
                      <div className="font-semibold">${minInvestment.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="text-xs text-gray-500">Structure</div>
                      <div className="font-semibold text-xs">{product.structure}</div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedProduct(product)}
                  className="w-full"
                  variant="default"
                >
                  Invest Now
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Investment Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invest in {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Complete your investment in this product.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((currency) => (
                    <SelectItem key={currency.currency} value={currency.currency}>
                      {currency.symbol} {currency.displayName} - Balance: {currency.balance.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount">Investment Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {currencySymbols[selectedCurrency] || selectedCurrency}{availableBalance.toLocaleString()}
              </p>
            </div>

            {selectedProduct && (
              <div className="bg-blue-50 p-3 rounded-lg space-y-1">
                <p className="text-sm"><strong>Minimum Investment:</strong> ${parseFloat(selectedProduct.minimumInvestment).toLocaleString()}</p>
                <p className="text-sm"><strong>Target IRR:</strong> {selectedProduct.targetNetIrr}</p>
                <p className="text-sm"><strong>Term:</strong> {selectedProduct.term}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleInvest}
                disabled={investMutation.isPending}
              >
                {investMutation.isPending ? 'Creating...' : 'Create Investment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}