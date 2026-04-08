import { useState, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

interface CheckoutFormProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

function CheckoutForm({ onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/wallets?stripe=success`,
      },
    });

    if (error) {
      onError(error.message ?? 'Payment failed. Please try again.');
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full h-9 text-sm"
      >
        {loading ? 'Processing payment...' : 'Confirm Payment'}
      </Button>
    </form>
  );
}

interface StripePaymentFormProps {
  publishableKey: string;
  clientSecret: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function StripePaymentForm({ publishableKey, clientSecret, onSuccess, onError }: StripePaymentFormProps) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <CheckoutForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
