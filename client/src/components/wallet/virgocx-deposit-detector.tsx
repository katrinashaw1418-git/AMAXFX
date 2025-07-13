import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface VirgoCXDepositDetectorProps {
  userId: number;
}

interface VirgoCXDeposit {
  id: string;
  currency: string;
  amount: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  requiredConfirmations: number;
  detectedAt: string;
  completedAt?: string;
}

export default function VirgoCXDepositDetector({ userId }: VirgoCXDepositDetectorProps) {
  const { data: deposits = [], isLoading } = useQuery({
    queryKey: ['/api/virgocx/deposits', userId],
    queryFn: () => apiRequest('GET', `/api/virgocx/deposits?userId=${userId}`).then(res => res.json()),
    refetchInterval: 10000, // Check every 10 seconds
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Monitoring VirgoCX Deposits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">Checking for incoming transfers...</div>
        </CardContent>
      </Card>
    );
  }

  if (deposits.length === 0) {
    return (
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          No incoming deposits from VirgoCX detected. Deposits will appear here automatically when detected on the blockchain.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          VirgoCX Deposits Detected
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deposits.map((deposit: VirgoCXDeposit) => (
            <div key={deposit.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(deposit.status)}
                  <span className="font-medium">{deposit.amount} {deposit.currency}</span>
                  <Badge className={getStatusColor(deposit.status)}>
                    {deposit.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(deposit.detectedAt)}
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span>Transaction:</span>
                  <a 
                    href={`https://blockstream.info/tx/${deposit.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {deposit.txHash.slice(0, 8)}...{deposit.txHash.slice(-8)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {deposit.status === 'pending' && (
                <div className="text-xs text-yellow-600">
                  Confirmations: {deposit.confirmations}/{deposit.requiredConfirmations}
                </div>
              )}

              {deposit.status === 'confirmed' && deposit.completedAt && (
                <div className="text-xs text-green-600">
                  Completed: {formatDate(deposit.completedAt)}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}