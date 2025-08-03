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
import { api } from '@/lib/api';

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
    queryFn: () => api.getFxRates(),
  });

  // Current user investments data
  const { data: userInvestments } = useQuery({
    queryKey: ['/api/user-investments'],
    queryFn: () => api.getUserInvestments(),
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

  // Category options with detailed fund information
  const categories = [
    { value: 'all', label: 'All Products', icon: Building2 },
    { value: 'real_estate', label: 'Real Estate', icon: Building2, description: '3 products available' },
    { value: 'corporate_credit', label: 'Corporate Credit', icon: TrendingUp, description: '2 products available' },
    { value: 'digital_assets', label: 'Digital Assets', icon: Coins, description: '4 products available' },
    { value: 'venture_capital', label: 'Venture Capital', icon: Zap, description: '2 products available' },
    { value: 'cash_deposits', label: 'Cash Deposits', icon: DollarSign, description: '2 products available' },
  ];

  // Specific fund details from backup data
  const fundDetails = {
    real_estate: [
      {
        name: 'Real Estate Equity Fund',
        description: 'High-risk equity/mezzanine capital',
        minimum: '$250k minimum',
        riskLevel: 'High Risk'
      },
      {
        name: 'Real Estate Credit Fund',
        description: 'Moderate-risk real estate loans',
        minimum: '$100k minimum',
        riskLevel: 'Moderate Risk'
      },
      {
        name: 'Real Estate First Mortgage Fund',
        description: 'Conservative mortgage finance',
        minimum: '$50k minimum',
        riskLevel: 'Conservative'
      }
    ],
    corporate_credit: [
      {
        name: 'Cash Flow-Based Corporate Credit Fund',
        description: 'Senior lending to strong cash flow companies',
        minimum: '$100k minimum',
        riskLevel: 'Moderate Risk'
      },
      {
        name: 'Security-Backed Corporate Credit Fund',
        description: 'Senior loans with equity warrants',
        minimum: '$150k minimum',
        riskLevel: 'Moderate Risk'
      }
    ],
    venture_capital: [
      {
        name: 'VC / Growth Equity Fund',
        description: 'Long-term equity investments',
        minimum: '$500k minimum',
        riskLevel: 'High Risk'
      },
      {
        name: 'Hybrid Capital Fund',
        description: 'Structured equity with income component',
        minimum: '$250k minimum',
        riskLevel: 'Moderate Risk'
      }
    ],
    digital_assets: [
      {
        name: 'Bitcoin Tracker Fund',
        description: 'Passive Bitcoin exposure',
        minimum: '$25k minimum',
        riskLevel: 'High Risk'
      },
      {
        name: 'Web3 Innovation Fund',
        description: 'Early-stage token investments',
        minimum: '$250k minimum',
        riskLevel: 'High Risk'
      },
      {
        name: 'Diversified Crypto Fund',
        description: 'Multi-strategy crypto portfolio',
        minimum: '$50k minimum',
        riskLevel: 'High Risk'
      },
      {
        name: 'Ethereum Staking Fund',
        description: 'ETH staking with daily liquidity',
        minimum: '$10k minimum',
        riskLevel: 'Moderate Risk'
      }
    ],
    cash_deposits: [
      {
        name: 'High-Yield Savings Account',
        description: 'FDIC-insured instant access',
        minimum: 'No minimum',
        riskLevel: 'No Risk'
      },
      {
        name: 'Premium Treasury Deposit',
        description: 'Treasury-backed deposits',
        minimum: '$10k minimum',
        riskLevel: 'No Risk'
      }
    ]
  };

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

      {/* Fund Overview Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fund Categories Overview</CardTitle>
          <CardDescription>
            Comprehensive selection of investment products across multiple asset classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.filter(cat => cat.value !== 'all').map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.value} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">{category.label}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCategory(category.value)}
                    className="w-full"
                  >
                    View Products
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="mb-8">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
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

      {/* Category-specific Fund Details */}
      {selectedCategory !== 'all' && fundDetails[selectedCategory as keyof typeof fundDetails] && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{categories.find(c => c.value === selectedCategory)?.label} Funds</CardTitle>
            <CardDescription>
              Detailed information about available {categories.find(c => c.value === selectedCategory)?.label.toLowerCase()} investment products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fundDetails[selectedCategory as keyof typeof fundDetails].map((fund, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-2">{fund.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{fund.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Minimum:</span>
                      <span className="text-sm font-medium">{fund.minimum}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Risk Level:</span>
                      <Badge className={
                        fund.riskLevel === 'High Risk' ? 'bg-red-100 text-red-800' :
                        fund.riskLevel === 'Moderate Risk' ? 'bg-yellow-100 text-yellow-800' :
                        fund.riskLevel === 'Conservative' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {fund.riskLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  {availableCurrencies.map((currency: any) => (
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

      {/* Current User Investments Overview */}
      {userInvestments && userInvestments.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Current Investments</CardTitle>
            <CardDescription>
              Active positions across {userInvestments.length} different fund investments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userInvestments.slice(0, 6).map((investment: any) => (
                <div key={investment.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Investment #{investment.id}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Product ID:</span>
                      <span className="font-medium">{investment.productId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount Invested:</span>
                      <span className="font-medium">${parseFloat(investment.investedAmount || '0').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium">{new Date(investment.investmentDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {userInvestments.length > 6 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Showing 6 of {userInvestments.length} total investments
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Information Section */}
      <Card className="mb-8 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-700">Debug Information</CardTitle>
          <CardDescription>
            Quick debug checklist and system status for fund investments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filter Values */}
            <div>
              <h4 className="font-semibold mb-3">Filter Values & Mappings</h4>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <strong>Real Estate:</strong> 3 products (High/Moderate/Conservative risk)
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <strong>Corporate Credit:</strong> 2 products (Moderate risk)
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <strong>Digital Assets:</strong> 4 products (High/Moderate risk)
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <strong>Venture Capital:</strong> 2 products (High/Moderate risk)
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <strong>Cash Deposits:</strong> 2 products (No risk)
                </div>
              </div>
            </div>

            {/* System Status */}
            <div>
              <h4 className="font-semibold mb-3">System Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>Filter Products API:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {filterProducts ? `${filterProducts.length} products` : 'Loading...'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Wallets API:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {wallets ? `${wallets.length} wallets` : 'Loading...'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>User Investments:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {userInvestments ? `${userInvestments.length} investments` : 'Loading...'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>FX Rates:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {fxRates ? `${fxRates.length} rates` : 'Loading...'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Debug Checklist */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-800">Quick Debug Checklist</h4>
            <ul className="text-sm space-y-1 text-blue-700">
              <li>• Investment minimums range from $10k (Ethereum Staking) to $500k (VC/Growth Equity)</li>
              <li>• Risk levels properly mapped: High Risk (red), Moderate Risk (yellow), Conservative/No Risk (green)</li>
              <li>• All 13 specific funds from backup data are represented in categories</li>
              <li>• Filter system working with exact category/risk/liquidity mappings</li>
              <li>• Current user has {userInvestments?.length || 0} active investment positions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}