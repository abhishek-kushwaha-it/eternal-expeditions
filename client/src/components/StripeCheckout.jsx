import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../core-components';
import { useToasts } from '../store/hooks';
import './StripeCheckout.css';

/**
 * StripeCheckout Component
 * Handles the Stripe payment card form and submission
 * Wraps CardElement from @stripe/react-stripe-js
 */
export default function StripeCheckout({ onPaymentSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Payment system not initialized. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // This is a simplified example. In production with Stripe Hosted Checkout,
      // the payment is handled by Stripe's hosted page, not this component.
      // This component serves as a fallback for custom payment flows.

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        setError(pmError.message);
        addToast(pmError.message, 'error');
        return;
      }

      // In production, you would send paymentMethod.id to your backend
      // Backend would confirm the payment intent
      console.log('Payment method created:', paymentMethod.id);

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }

      addToast('Payment processed successfully!', 'success');
      setTimeout(() => {
        navigate('/my-tour-bookings');
      }, 1500);
    } catch (err) {
      const errorMessage = err.message || 'An error occurred during payment processing';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form className="stripe-checkout-form" onSubmit={handleSubmit}>
      <div className="stripe-checkout-container">
        <h2 className="stripe-checkout-title">Payment Information</h2>

        <div className="card-element-wrapper">
          <label htmlFor="card-element" className="card-element-label">
            Credit or debit card
          </label>
          <CardElement id="card-element" options={cardElementOptions} />
        </div>

        {error && <div className="stripe-error-message">{error}</div>}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={!stripe || isProcessing}
          className="stripe-submit-btn"
        >
          {isProcessing ? 'Processing Payment...' : 'Complete Payment'}
        </Button>

        <p className="stripe-disclaimer">
          Your payment information is secure and encrypted. We use Stripe to process all payments.
        </p>
      </div>
    </form>
  );
}
