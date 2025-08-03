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

import { Filter, Phone, MessageCircle, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InvestmentPerformanceChart } from "@/components/dashboard/investment-performance-chart";
import { InvestmentBreakdownDetail } from "@/components/dashboard/investment-breakdown-detail";



export default function Investments() {

  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);
  const [advisorMessage, setAdvisorMessage] = useState('');
  const [showAdvisorBox, setShowAdvisorBox] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();



  const { data: userInvestments, isLoading: investmentsLoading } = useQuery({
    queryKey: ["/api/user-investments"],
    queryFn: () => api.getUserInvestments(),
    refetchInterval: 5000, // Refresh every 5 seconds to track investment changes
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



  if (investmentsLoading) {
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

      {/* Link to Fund Investments Page */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Investment Funds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Explore our curated selection of investment products across multiple asset classes including Real Estate, Corporate Credit, Digital Assets, and Venture Capital.
          </p>
          <Button asChild>
            <a href="/fund-investments">
              View Investment Funds
            </a>
          </Button>
        </CardContent>
      </Card>

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