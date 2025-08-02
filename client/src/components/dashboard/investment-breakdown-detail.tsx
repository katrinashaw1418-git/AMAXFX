import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Building, CreditCard, Rocket, Bitcoin, DollarSign, TrendingUp, TrendingDown, Target, Calendar, Clock, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

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

interface ProductBreakdownProps {
  showTitle?: boolean;
  compact?: boolean;
}

export function InvestmentBreakdownDetail({ showTitle = true, compact = false }: ProductBreakdownProps) {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const { data: investmentPerformance, isLoading } = useQuery({
    queryKey: ["/api/investment-performance", { timeframe: "1Y" }],
    queryFn: () => api.getInvestmentPerformance({ timeframe: "1Y" }),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: userInvestments } = useQuery({
    queryKey: ["/api/user-investments"],
    queryFn: () => api.getUserInvestments(),
    refetchInterval: 5000,
  });

  const { data: products } = useQuery({
    queryKey: ["/api/investment-products"],
    queryFn: () => api.getInvestmentProducts(),
  });

  const { data: wallets } = useQuery({
    queryKey: ["/api/wallets"],
    queryFn: () => api.getWallets(),
    refetchInterval: 5000,
  });

  const { data: fxRates } = useQuery({
    queryKey: ["/api/fx-rates"],
    queryFn: () => api.getFxRates(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle>Investment Breakdown by Product</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!investmentPerformance || !userInvestments || !products) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle>Investment Breakdown by Product</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-gray-500">No investment data available</p>
        </CardContent>
      </Card>
    );
  }

  // Currency symbols and helper functions
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

  const selectedWallet = wallets?.find(w => w.currency === selectedCurrency);
  const availableBalance = selectedWallet?.availableBalance ? parseFloat(selectedWallet.availableBalance) : 0;

  // Group investments by product
  const productGroups: Record<string, any> = {};
  userInvestments.forEach((investment: any) => {
    const product = products.find((p: any) => p.id === investment.productId);
    if (product) {
      if (!productGroups[product.id]) {
        productGroups[product.id] = {
          product,
          investments: [],
          totalInvested: 0,
          totalCurrentValue: 0,
          totalReturn: 0,
        };
      }
      productGroups[product.id].investments.push(investment);
      productGroups[product.id].totalInvested += parseFloat(investment.investedAmount);
    }
  });

  // Calculate current values directly from user investments with accurate IRR and actual terms
  const productIRRMapping: Record<number, { midpointIRR: number; targetIRRDisplay: string; termYears: number; termDescription: string }> = {
    1: { midpointIRR: 0.104, targetIRRDisplay: '10.4%', termYears: 4.25, termDescription: '2–6.5 years (midpoint: 4.25 years)' }, // Real Estate Equity Fund
    2: { midpointIRR: 0.11, targetIRRDisplay: '11.0%', termYears: 0.85, termDescription: '~10.2 months (rolling)' },  // Real Estate Credit Fund
    3: { midpointIRR: 0.09, targetIRRDisplay: '9.0%', termYears: 0.78, termDescription: '~9.4 months' },   // Real Estate First Mortgage Fund
    4: { midpointIRR: 0.11, targetIRRDisplay: '11.0%', termYears: 2.5, termDescription: '2–3 years (midpoint: 2.5 years)' },  // Cash Flow-Based Corporate Credit Fund
    5: { midpointIRR: 0.135, targetIRRDisplay: '13.5%', termYears: 2.875, termDescription: '30–39 months (midpoint: 2.875 years)' }, // Security-Backed Corporate Credit Fund
    6: { midpointIRR: 0.18, targetIRRDisplay: '18.0%', termYears: 6, termDescription: '5–7+ years (midpoint: 6 years)' },  // VC / Growth Equity Fund
  };

  // Helper function to calculate holding period
  const calculateHoldingPeriod = (investmentDate: string) => {
    const now = new Date();
    const invested = new Date(investmentDate);
    const diffMs = now.getTime() - invested.getTime();
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays === 0) return `${months} month${months > 1 ? 's' : ''}`;
      return `${months}m ${remainingDays}d`;
    }
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    if (remainingDays < 30) return `${years} year${years > 1 ? 's' : ''}`;
    const months = Math.floor(remainingDays / 30);
    return `${years}y ${months}m`;
  };

  Object.values(productGroups).forEach((group: any) => {
    let totalCurrentValue = 0;
    let totalReturn = 0;
    
    // Calculate from individual investments using exact midpoint IRR and add holding period info
    group.investments.forEach((investment: any) => {
      const currentValue = parseFloat(investment.currentValue);
      const returnAmount = parseFloat(investment.totalReturn);
      totalCurrentValue += currentValue;
      totalReturn += returnAmount;
      
      // Add holding period and formatted date
      investment.holdingPeriod = calculateHoldingPeriod(investment.investmentDate);
      investment.formattedDate = new Date(investment.investmentDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    });
    
    group.totalCurrentValue = totalCurrentValue;
    group.totalReturn = totalReturn;
    group.returnPercent = group.totalInvested > 0 ? (group.totalReturn / group.totalInvested) * 100 : 0;
    
    // Use exact midpoint IRR for display and term expiry projections
    const productIRR = productIRRMapping[group.product.id];
    if (productIRR) {
      group.targetIRR = productIRR.midpointIRR * 100;
      group.targetIRRDisplay = productIRR.targetIRRDisplay;
      group.termDescription = productIRR.termDescription;
      
      // Calculate projection upon term expiry using actual midpoint term
      const termExpiryGrowthFactor = Math.pow(1 + productIRR.midpointIRR, productIRR.termYears);
      group.termExpiryValue = group.totalInvested * termExpiryGrowthFactor;
      group.termExpiryReturn = group.termExpiryValue - group.totalInvested;
      group.termExpiryPercent = ((group.termExpiryReturn / group.totalInvested) * 100);
    } else {
      // Fallback for products not in mapping
      group.targetIRR = 11;
      group.targetIRRDisplay = '11.0%';
      group.termDescription = '3 years (estimated)';
      const termExpiryGrowthFactor = Math.pow(1.11, 3);
      group.termExpiryValue = group.totalInvested * termExpiryGrowthFactor;
      group.termExpiryReturn = group.termExpiryValue - group.totalInvested;
      group.termExpiryPercent = ((group.termExpiryReturn / group.totalInvested) * 100);
    }
  });

  const sortedGroups = Object.values(productGroups).sort((a: any, b: any) => b.returnPercent - a.returnPercent);

  // Calculate totals from user investments (current values)
  const actualTotalInvested = userInvestments.reduce((sum: number, inv: any) => sum + parseFloat(inv.investedAmount), 0);
  const actualTotalCurrentValue = userInvestments.reduce((sum: number, inv: any) => sum + parseFloat(inv.currentValue), 0);
  const actualTotalReturn = actualTotalCurrentValue - actualTotalInvested;
  const actualTotalReturnPercent = actualTotalInvested > 0 ? (actualTotalReturn / actualTotalInvested) * 100 : 0;
  
  // Calculate term expiry totals
  const totalTermExpiryValue = Object.values(productGroups).reduce((sum: number, group: any) => sum + (group.termExpiryValue || 0), 0);
  const totalTermExpiryReturn = totalTermExpiryValue - actualTotalInvested;
  const totalTermExpiryPercent = actualTotalInvested > 0 ? (totalTermExpiryReturn / actualTotalInvested) * 100 : 0;
  
  const totalInvested = actualTotalInvested;
  const totalReturn = actualTotalReturn;
  const totalReturnPercent = actualTotalReturnPercent;

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Investment Breakdown by Product
          </CardTitle>
          <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <p className="text-gray-600">Total Invested</p>
              <p className="text-xl font-bold">${totalInvested.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Current Return</p>
              <p className={`text-xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(totalReturn).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Term Expiry Value</p>
              <p className="text-xl font-bold text-blue-600">
                ${totalTermExpiryValue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Expected Return</p>
              <p className="text-xl font-bold text-purple-600">
                +${totalTermExpiryReturn.toLocaleString()} ({totalTermExpiryPercent.toFixed(1)}%)
              </p>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        <div className="space-y-4">
          {sortedGroups.map((group: any, index: number) => {
            const IconComponent = categoryIcons[group.product.category as keyof typeof categoryIcons] || Building;
            const categoryLabel = categoryLabels[group.product.category as keyof typeof categoryLabels] || group.product.category;
            
            return (
              <div key={group.product.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">{group.product.name}</h4>
                      <p className="text-sm text-gray-600">{categoryLabel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={group.returnPercent >= 0 ? "default" : "destructive"}>
                      #{index + 1} • {group.returnPercent >= 0 ? '+' : ''}{group.returnPercent.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Invested</p>
                    <p className="font-medium">${group.totalInvested.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Current Value</p>
                    <p className="font-medium">${group.totalCurrentValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Return</p>
                    <p className={`font-medium ${group.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {group.totalReturn >= 0 ? '+' : ''}${Math.abs(group.totalReturn).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Target IRR</p>
                    <p className="font-medium">{group.targetIRRDisplay || group.targetIRR.toFixed(1) + '%'}</p>
                  </div>
                </div>
                
                {!compact && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Term Expiry Projection</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          ${group.termExpiryValue.toLocaleString()} 
                          <span className="ml-2 text-green-600">
                            (+${group.termExpiryReturn.toLocaleString()})
                          </span>
                        </p>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          {group.termExpiryPercent.toFixed(0)}% return ({group.termDescription})
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Investment Details */}
                <div className="mt-3 space-y-2">
                  {group.investments.map((investment: any, invIndex: number) => (
                    <div key={investment.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{investment.id}
                        </Badge>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>{investment.formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>{investment.holdingPeriod}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${parseFloat(investment.investedAmount).toLocaleString()}</div>
                        <div className={`text-xs ${parseFloat(investment.totalReturn) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(investment.totalReturn) >= 0 ? '+' : ''}${Math.abs(parseFloat(investment.totalReturn)).toLocaleString()} 
                          ({parseFloat(investment.returnPercent).toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  {group.investments.length} investment{group.investments.length !== 1 ? 's' : ''} • 
                  Using {group.targetIRRDisplay || group.targetIRR.toFixed(1) + '%'} midpoint IRR calculation
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Available Capital Section */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-600" />
              <h4 className="font-medium">Available Capital</h4>
            </div>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-auto min-w-16 h-6 text-xs border border-green-200 rounded px-2 py-0 focus:ring-1 focus:ring-green-500 bg-green-50 hover:bg-green-100 transition-colors font-semibold text-green-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((currency) => (
                  <SelectItem key={currency.currency} value={currency.currency}>
                    <span className="font-medium">{currency.currency}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available in {selectedCurrency} wallet</p>
                <p className="text-xl font-bold text-green-600">
                  {currencySymbols[selectedCurrency] || selectedCurrency}{availableBalance.toLocaleString()}
                </p>
                {selectedCurrency !== 'USD' && (
                  <p className="text-xs text-gray-600 mt-1">
                    US${getUsdEquivalent(availableBalance, selectedCurrency).toLocaleString()} equivalent
                  </p>
                )}
              </div>
              <div className="text-right">
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                  Ready to Invest
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600 space-y-1">
            <p>• All calculations use consistent midpoint IRR methodology</p>
            <p>• Current values update automatically when new investments are added</p>
            <p>• Term expiry projections based on actual product investment terms</p>
            <p>• Each product matures at different times based on real terms</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}