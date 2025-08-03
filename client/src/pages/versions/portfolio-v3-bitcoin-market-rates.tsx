import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { usePortfolio, useWallets, useUserInvestments, usePortfolioAllocation } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Bitcoin, PieChart as PieChartIcon, Target, RefreshCw, Phone, MessageCircle, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const COLORS = ['hsl(207, 90%, 54%)', 'hsl(0, 84%, 55%)', '#D1D5DB', '#8B5CF6', '#10B981', '#F59E0B'];

// Category-specific colors
const getCategoryColor = (categoryName: string) => {
  const colorMap: { [key: string]: string } = {
    'Real Estate': '#8B4513',     // Brown
    'Corporate Credit': '#D1D5DB',  // Gray-300
    'Venture Capital': '#8B5CF6',  // Purple
    'Digital Assets': '#EF4444',   // Red
    'Cash Deposits': '#3B82F6'     // Blue
  };
  return colorMap[categoryName] || '#6B7280'; // Default gray
};

export default function PortfolioV3BitcoinMarketRates() {
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);
  const [advisorMessage, setAdvisorMessage] = useState('');
  const [showAdvisorBox, setShowAdvisorBox] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  
  // Real-time investment tracking with 5-second refresh
  const { data: userInvestments, isLoading: investmentsLoading } = useQuery({
    queryKey: ["/api/user-investments"],
    queryFn: async () => {
      const response = await fetch("/api/user-investments");
      if (!response.ok) throw new Error("Failed to fetch user investments");
      return response.json();
    },
    refetchInterval: 5000, // Real-time tracking of investment changes
  });
  
  const { data: allocation, isLoading: allocationLoading } = usePortfolioAllocation();
  
  const { data: investmentBreakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ["/api/investment-breakdown"],
    queryFn: async () => {
      const response = await fetch("/api/investment-breakdown");
      if (!response.ok) throw new Error("Failed to fetch investment breakdown");
      return response.json();
    },
    refetchInterval: 5000, // Real-time tracking of portfolio changes
  });

  // Calculate portfolio performance metrics
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

  // Group investments by product for display
  const groupedInvestments = userInvestments ? userInvestments.reduce((acc: any, investment: any) => {
    const key = investment.productId;
    if (!acc[key]) {
      acc[key] = {
        productId: investment.productId,
        investments: [],
        totalInvested: 0,
        totalCurrent: 0,
        totalReturn: 0
      };
    }
    acc[key].investments.push(investment);
    acc[key].totalInvested += parseFloat(investment.investedAmount);
    acc[key].totalCurrent += parseFloat(investment.currentValue);
    acc[key].totalReturn += parseFloat(investment.totalReturn);
    return acc;
  }, {}) : {};

  // Product name mapping
  const getProductName = (productId: number) => {
    const productNames: { [key: number]: string } = {
      1: "Real Estate Equity Fund",
      2: "Real Estate Credit Fund", 
      3: "Private Credit Fund",
      4: "Corporate Credit Fund",
      5: "Infrastructure Debt Fund",
      6: "VC/Growth Equity Fund",
      7: "Hedge Fund Strategies",
      8: "Bitcoin Tracker Fund",
      9: "Web3 Innovation Fund",
      10: "DeFi Yield Fund",
      11: "Ethereum Staking Fund",
      12: "High-Yield Savings"
    };
    return productNames[productId] || `Product ${productId}`;
  };

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

  const handleAdvisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorMessage.trim()) return;
    advisorMutation.mutate({ message: advisorMessage });
  };

  if (portfolioLoading || walletsLoading || investmentsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Version Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Portfolio v3.0 - Bitcoin Market-Based Returns</h3>
            <p className="text-sm text-blue-700">
              Real-time tracking with 60% Bitcoin market-based performance calculation
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            v3.0
          </Badge>
        </div>
      </div>

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>
        <p className="text-muted-foreground">
          Monitor your cross-border wealth management portfolio with real-time performance tracking
        </p>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold">${metrics.totalInvested.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Value</p>
                <p className="text-2xl font-bold">${metrics.totalCurrent.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Return</p>
                <p className={`text-2xl font-bold ${metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${metrics.totalReturn.toLocaleString()}
                </p>
              </div>
              {metrics.totalReturn >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Return %</p>
                <p className={`text-2xl font-bold ${metrics.returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.returnPercent >= 0 ? '+' : ''}{metrics.returnPercent.toFixed(2)}%
                </p>
              </div>
              <PieChartIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5" />
            Investment Holdings (Real-time)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(groupedInvestments).map((group: any) => {
              const returnPercent = group.totalInvested > 0 ? (group.totalReturn / group.totalInvested) * 100 : 0;
              const productName = getProductName(group.productId);
              
              return (
                <div key={group.productId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{productName}</h3>
                      <div className="text-right">
                        <p className="font-semibold">${group.totalCurrent.toLocaleString()}</p>
                        <p className={`text-sm ${group.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {group.totalReturn >= 0 ? '+' : ''}${group.totalReturn.toLocaleString()} ({returnPercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        Invested: ${group.totalInvested.toLocaleString()}
                        {group.investments.length > 1 && (
                          <span className="ml-2 text-blue-600">({group.investments.length} positions)</span>
                        )}
                      </p>
                      {/* Show individual positions if multiple */}
                      {group.investments.length > 1 && (
                        <div className="mt-2 pl-4 border-l-2 border-gray-200">
                          {group.investments.map((inv: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-600 py-1">
                              Position {idx + 1}: ${parseFloat(inv.investedAmount).toLocaleString()} → 
                              ${parseFloat(inv.currentValue).toLocaleString()} 
                              ({parseFloat(inv.returnPercent).toFixed(2)}%)
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Calculation Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Market-Based Returns</h4>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Bitcoin Tracker Fund:</strong> 60% annualized (market-based historical performance)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Midpoint IRR Returns</h4>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Real Estate:</strong> 11% midpoint IRR</li>
                <li>• <strong>Corporate Credit:</strong> 11% midpoint IRR</li>
                <li>• <strong>Venture Capital:</strong> 18% midpoint IRR</li>
                <li>• <strong>Ethereum Staking:</strong> 5.75% midpoint IRR</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Real-time Updates:</strong> Investment values refresh every 5 seconds to track portfolio changes 
              including new investments, ensuring accurate performance calculations with dilution effects.
            </p>
          </div>
        </CardContent>
      </Card>

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
                Need help with your portfolio? Contact your dedicated wealth planner.
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
                        Send a message to your dedicated wealth planner. They'll respond within 24 hours.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdvisorSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="How can we help you with your portfolio?"
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