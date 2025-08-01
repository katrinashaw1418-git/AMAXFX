import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePortfolio } from "@/hooks/use-portfolio";

const mockChartData = [
  { month: 'Jan', value: 2200000 },
  { month: 'Feb', value: 2350000 },
  { month: 'Mar', value: 2180000 },
  { month: 'Apr', value: 2420000 },
  { month: 'May', value: 2380000 },
  { month: 'Jun', value: 2550000 },
  { month: 'Jul', value: 2620000 },
  { month: 'Aug', value: 2580000 },
  { month: 'Sep', value: 2750000 },
  { month: 'Oct', value: 2680000 },
  { month: 'Nov', value: 2820000 },
  { month: 'Dec', value: 2847392 },
];

export default function PortfolioChart() {
  const { data: portfolio } = usePortfolio();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Portfolio Performance</CardTitle>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="default">1M</Button>
            <Button size="sm" variant="outline">3M</Button>
            <Button size="sm" variant="outline">1Y</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData}>
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
