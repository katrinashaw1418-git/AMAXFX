import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAiRecommendations } from "@/hooks/use-portfolio";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Shield, 
  BarChart3,
  Zap,
  CheckCircle,
  Clock,
  Eye,
  EyeOff
} from "lucide-react";

export default function AiAdvisory() {
  const [riskTolerance, setRiskTolerance] = useState([3]);
  const [investmentHorizon, setInvestmentHorizon] = useState("5-10");
  const [investmentGoal, setInvestmentGoal] = useState("growth");
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const { data: recommendations, isLoading } = useAiRecommendations();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => api.markRecommendationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-recommendations"] });
    },
  });

  const applyRecommendationMutation = useMutation({
    mutationFn: (id: number) => api.applyRecommendation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-recommendations"] });
      toast({
        title: "Recommendation Applied",
        description: "The AI recommendation has been successfully implemented.",
      });
    },
    onError: () => {
      toast({
        title: "Application Failed",
        description: "Unable to apply the recommendation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "rebalancing":
        return Lightbulb;
      case "opportunity":
        return TrendingUp;
      case "risk_warning":
        return AlertTriangle;
      default:
        return Lightbulb;
    }
  };

  const getRecommendationColor = (severity: string) => {
    switch (severity) {
      case "info":
        return "bg-blue-50 border-blue-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "alert":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getIconColor = (severity: string) => {
    switch (severity) {
      case "info":
        return "text-blue-600";
      case "warning":
        return "text-yellow-600";
      case "alert":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  const getTitleColor = (severity: string) => {
    switch (severity) {
      case "info":
        return "text-blue-900";
      case "warning":
        return "text-yellow-900";
      case "alert":
        return "text-red-900";
      default:
        return "text-blue-900";
    }
  };

  const getDescriptionColor = (severity: string) => {
    switch (severity) {
      case "info":
        return "text-blue-700";
      case "warning":
        return "text-yellow-700";
      case "alert":
        return "text-red-700";
      default:
        return "text-blue-700";
    }
  };

  // Mock AI-generated portfolio suggestion
  const suggestedAllocation = [
    { asset: "US Equities", current: 35, suggested: 30, change: -5, color: "bg-blue-500" },
    { asset: "International Equities", current: 20, suggested: 25, change: 5, color: "bg-green-500" },
    { asset: "Bonds", current: 25, suggested: 30, change: 5, color: "bg-purple-500" },
    { asset: "Crypto", current: 15, suggested: 10, change: -5, color: "bg-yellow-500" },
    { asset: "Cash", current: 5, suggested: 5, change: 0, color: "bg-gray-500" },
  ];

  const riskProfile = {
    score: riskTolerance[0] * 20,
    level: riskTolerance[0] <= 2 ? "Conservative" : riskTolerance[0] <= 4 ? "Moderate" : "Aggressive",
    description: riskTolerance[0] <= 2 
      ? "You prefer stable returns with minimal risk of loss"
      : riskTolerance[0] <= 4 
      ? "You're comfortable with some volatility for potentially higher returns"
      : "You're willing to accept high volatility for maximum growth potential"
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-20 w-full" />
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
          <h1 className="text-2xl font-bold">AI Advisory Dashboard</h1>
          <p className="text-gray-600">Personalized investment insights and recommendations</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">AI Advisory Active</p>
            <p className="text-xs text-gray-500">Last updated: 2 minutes ago</p>
          </div>
        </div>
      </div>

      {/* AI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Risk Score</h3>
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{riskProfile.score}/100</p>
            <p className="text-sm text-gray-600 mt-1">{riskProfile.level}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Active Recommendations</h3>
              <Lightbulb className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold">{recommendations?.length || 0}</p>
            <p className="text-sm text-gray-600 mt-1">New insights</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Portfolio Health</h3>
              <BarChart3 className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-2xl font-bold text-secondary">85%</p>
            <p className="text-sm text-gray-600 mt-1">Well diversified</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Optimization Potential</h3>
              <Zap className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600">+2.4%</p>
            <p className="text-sm text-gray-600 mt-1">Annual return boost</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Profile Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Risk Tolerance</Label>
                <div className="mt-2">
                  <Slider
                    value={riskTolerance}
                    onValueChange={setRiskTolerance}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Conservative</span>
                    <span>Aggressive</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="investment-horizon">Investment Horizon</Label>
                <Select value={investmentHorizon} onValueChange={setInvestmentHorizon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="5-10">5-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="investment-goal">Primary Goal</Label>
                <Select value={investmentGoal} onValueChange={setInvestmentGoal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preservation">Capital Preservation</SelectItem>
                    <SelectItem value="income">Income Generation</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="aggressive">Aggressive Growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Your Profile</h4>
                <p className="text-sm text-gray-600">{riskProfile.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations?.map((recommendation) => {
                  const Icon = getRecommendationIcon(recommendation.type);
                  
                  return (
                    <div
                      key={recommendation.id}
                      className={`p-4 rounded-lg border ${getRecommendationColor(recommendation.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Icon className={`w-5 h-5 mt-0.5 ${getIconColor(recommendation.severity)}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className={`font-medium ${getTitleColor(recommendation.severity)}`}>
                                {recommendation.title}
                              </h4>
                              <div className="flex items-center space-x-2">
                                {!recommendation.isRead && (
                                  <Badge variant="secondary" className="text-xs">New</Badge>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => markAsReadMutation.mutate(recommendation.id)}
                                >
                                  {recommendation.isRead ? (
                                    <EyeOff className="w-3 h-3" />
                                  ) : (
                                    <Eye className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <p className={`text-sm ${getDescriptionColor(recommendation.severity)} mb-3`}>
                              {recommendation.description}
                            </p>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedRecommendation(recommendation);
                                  setDetailsModalOpen(true);
                                }}
                              >
                                View Details
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => applyRecommendationMutation.mutate(recommendation.id)}
                                disabled={applyRecommendationMutation.isPending}
                              >
                                {applyRecommendationMutation.isPending ? "Applying..." : "Apply Suggestion"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Suggested Portfolio Allocation */}
          <Card>
            <CardHeader>
              <CardTitle>Suggested Portfolio Rebalancing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestedAllocation.map((allocation) => (
                  <div key={allocation.asset} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${allocation.color}`}></div>
                        <span className="font-medium">{allocation.asset}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">{allocation.current}%</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium">{allocation.suggested}%</span>
                        <Badge 
                          variant={allocation.change > 0 ? "default" : allocation.change < 0 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {allocation.change > 0 ? '+' : ''}{allocation.change}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Progress value={allocation.current} className="flex-1 h-2" />
                      <Progress value={allocation.suggested} className="flex-1 h-2" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Rebalancing Impact</h4>
                    <p className="text-sm text-blue-700">
                      This allocation could improve your risk-adjusted returns by 2.4% annually while 
                      reducing portfolio volatility by 1.8%. The changes align with your moderate risk profile.
                    </p>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4">
                Implement Rebalancing Strategy
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommendation Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRecommendation?.title}</DialogTitle>
            <DialogDescription>
              Detailed analysis and implementation guidance
            </DialogDescription>
          </DialogHeader>
          {selectedRecommendation && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Recommendation Type</h4>
                <Badge className="mb-2">
                  {selectedRecommendation.type.replace('_', ' ').toUpperCase()}
                </Badge>
                <p className="text-sm text-gray-600">{selectedRecommendation.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Impact Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Expected Return Improvement:</span>
                      <span className="font-semibold text-green-600">+1.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Reduction:</span>
                      <span className="font-semibold text-blue-600">-2.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Implementation Time:</span>
                      <span className="font-medium">2-3 business days</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Implementation Steps</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Review current allocation</li>
                    <li>Identify rebalancing targets</li>
                    <li>Execute trades gradually</li>
                    <li>Monitor performance impact</li>
                  </ol>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => {
                    applyRecommendationMutation.mutate(selectedRecommendation.id);
                    setDetailsModalOpen(false);
                  }}
                  disabled={applyRecommendationMutation.isPending}
                >
                  {applyRecommendationMutation.isPending ? "Applying..." : "Apply Recommendation"}
                </Button>
                <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
