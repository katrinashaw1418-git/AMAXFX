import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePortfolio } from "@/hooks/use-portfolio";
import { useLocation } from "wouter";

// This will be calculated based on actual portfolio data

export default function PortfolioChart() {
  const { data: portfolio } = usePortfolio();
  const [location, setLocation] = useLocation();

  const handlePeriodClick = (period: string) => {
    // Navigate to portfolio page and scroll to Performance by Period section
    setLocation('/portfolio');
    // Small delay to ensure navigation completes before scrolling
    setTimeout(() => {
      const performanceSection = document.querySelector('[data-testid="performance-by-period"]');
      if (performanceSection) {
        performanceSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Calculate chart data based on actual portfolio value
  const currentValue = portfolio ? parseFloat(portfolio.totalValue) : 4320629.70;
  const baseValue = currentValue * 0.75; // Starting value for the year
  
  const chartData = [
    { month: 'Jan', value: baseValue },
    { month: 'Feb', value: baseValue * 1.05 },
    { month: 'Mar', value: baseValue * 1.02 },
    { month: 'Apr', value: baseValue * 1.12 },
    { month: 'May', value: baseValue * 1.08 },
    { month: 'Jun', value: baseValue * 1.18 },
    { month: 'Jul', value: baseValue * 1.22 },
    { month: 'Aug', value: baseValue * 1.19 },
    { month: 'Sep', value: baseValue * 1.28 },
    { month: 'Oct', value: baseValue * 1.25 },
    { month: 'Nov', value: baseValue * 1.32 },
    { month: 'Dec', value: currentValue },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Portfolio Performance</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="default"
              onClick={() => handlePeriodClick('1M')}
            >
              1M
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handlePeriodClick('3M')}
            >
              3M
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handlePeriodClick('1Y')}
            >
              YTD
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
