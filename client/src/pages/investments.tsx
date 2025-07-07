import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Building, CreditCard, Rocket, Bitcoin, DollarSign, Clock, Shield, Filter, X } from "lucide-react";
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

export default function Investments() {
  const [filters, setFilters] = useState<{ category?: string; riskProfile?: string; liquidity?: string }>({});
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [investModalOpen, setInvestModalOpen] = useState(false);
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

    if (amount < minimumInvestment) {
      toast({
        title: "Below Minimum",
        description: `Minimum investment is $${minimumInvestment.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    investMutation.mutate({
      productId: selectedProduct.id,
      amount: amount,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investment Products</h1>
          <p className="text-gray-600">Explore and invest in structured wealth management products</p>
        </div>
      </div>

      {/* Portfolio Overview */}
      {userInvestments && userInvestments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Total Invested</h3>
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">${totalInvested.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Current Value</h3>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold">${totalCurrentValue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Total Return</h3>
                <TrendingUp className="w-4 h-4 text-secondary" />
              </div>
              <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalReturn.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Return %</h3>
                <TrendingUp className="w-4 h-4 text-secondary" />
              </div>
              <p className={`text-2xl font-bold ${totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalReturnPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
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
                    <span className="font-semibold text-green-600">{product.targetNetIrr}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Term:</span>
                    <span className="font-medium">{product.term}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Min. Investment:</span>
                    <span className="font-medium">${minimumInvestment.toLocaleString()}</span>
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
              <Label htmlFor="amount">Investment Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                placeholder="Enter amount"
              />
              {selectedProduct && (
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: ${parseFloat(selectedProduct.minimumInvestment).toLocaleString()}
                </p>
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
    </div>
  );
}