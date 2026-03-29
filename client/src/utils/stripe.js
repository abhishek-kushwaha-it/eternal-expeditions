// Stripe.js loading utility
// This will load Stripe.js from CDN for client-side payment integration

// Get Stripe public key from environment
const getStripePublicKey = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  if (!key) {
    console.error(
      'Stripe public key not configured. Add VITE_STRIPE_PUBLIC_KEY to .env files'
    );
    return null;
  }

  if (!key.startsWith('pk_')) {
    console.error('Invalid Stripe public key format. Should start with pk_');
    return null;
  }

  // Determine if we're in test or live mode
  const isTestMode = key.includes('test');
  const environment = isTestMode ? 'test' : 'live';

  if (import.meta.env.MODE !== 'production') {
    console.log(`[Stripe Config] Mode: ${environment} - ${isTestMode ? 'Testing' : 'Production'}`);
  }

  return key;
};

// Load Stripe.js from CDN
const loadStripeFromCDN = async () => {
  if (window.Stripe) {
    return window.Stripe;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => {
      if (window.Stripe) {
        resolve(window.Stripe);
      } else {
        reject(new Error('Stripe.js failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Stripe.js script'));
    document.head.appendChild(script);
  });
};

// Create a singleton Stripe instance
let stripePromise = null;

export const getStripe = async () => {
  const publicKey = getStripePublicKey();

  if (!publicKey) {
    return null;
  }

  if (!stripePromise) {
    stripePromise = (async () => {
      const Stripe = await loadStripeFromCDN();
      return Stripe(publicKey);
    })();
  }

  return stripePromise;
};

// Get environment information
export const getStripeEnvironment = () => {
  const key = getStripePublicKey();
  if (!key) return null;

  return {
    isTestMode: key.includes('test'),
    mode: key.includes('test') ? 'test' : 'live',
    isProduction: import.meta.env.MODE === 'production',
  };
};

// Verify Stripe is properly configured
export const isStripeConfigured = () => {
  return getStripePublicKey() !== null;
};
