/**
 * ============================================================================
 * STRIPE WEBHOOK SETUP GUIDE
 * ============================================================================
 *
 * This file documents the complete Stripe webhook implementation.
 *
 * WEBHOOK FLOW:
 * 1. User initiates checkout → Stripe checkout session created
 * 2. User completes payment in Stripe
 * 3. Stripe sends webhook event to: POST /api/v1/bookings/webhook/stripe
 * 4. System verifies webhook signature using STRIPE_WEBHOOK_SECRET
 * 5. System processes event and creates booking record
 * 6. Client confirms booking via GET /my-bookings
 *
 * ============================================================================
 * SETUP INSTRUCTIONS (DO THIS BEFORE PRODUCTION)
 * ============================================================================
 *
 * ### STEP 1: Get Stripe API Keys
 * 1. Log in to https://dashboard.stripe.com
 * 2. Go to Developers → API keys (test/live mode toggle)
 * 3. Copy:
 *    - Publishable key (pk_test_... or pk_live_...)
 *    - Secret key (sk_test_... or sk_live_...)
 *
 * ### STEP 2: Create Webhook Endpoint
 * 1. In Stripe Dashboard, go to Developers → Webhooks
 * 2. Click "Add endpoint"
 * 3. Endpoint URL: YOUR_DOMAIN/api/v1/bookings/webhook/stripe
 *    Examples:
 *    - Development: http://localhost:3000/api/v1/bookings/webhook/stripe
 *    - Production: https://api.eternal-expeditions.com/api/v1/bookings/webhook/stripe
 * 4. Events to send:
 *    ✓ checkout.session.completed
 *    ✓ charge.succeeded
 *    ✓ charge.failed
 *    ✓ payment_intent.succeeded
 *    ✓ payment_intent.payment_failed
 * 5. Click "Add endpoint"
 *
 * ### STEP 3: Get Webhook Signing Secret
 * 1. In the webhooks list, click your newly created endpoint
 * 2. Scroll down to "Signing secret"
 * 3. Click "Reveal" and copy the secret (whsec_...)
 * 4. Add to .env.production:
 *    STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
 *
 * ### STEP 4: Update Environment Variables
 * .env.production:
 *   STRIPE_SECRET_KEY=sk_live_your_key_here
 *   STRIPE_PUBLIC_KEY=pk_live_your_key_here
 *   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
 *
 * .env.development (for testing):
 *   STRIPE_SECRET_KEY=sk_test_your_key_here
 *   STRIPE_PUBLIC_KEY=pk_test_your_key_here
 *   STRIPE_WEBHOOK_SECRET=whsec_test_your_secret_here
 *
 * ============================================================================
 * TESTING THE WEBHOOK (LOCAL DEVELOPMENT)
 * ============================================================================
 *
 * ### Option 1: Using Stripe CLI (Recommended)
 * 1. Download Stripe CLI: https://stripe.com/docs/stripe-cli
 * 2. Authenticate: stripe login
 * 3. Forward webhook events to local server:
 *    stripe listen --forward-to localhost:3000/api/v1/bookings/webhook/stripe
 * 4. Copy the webhook signing secret and add to .env.development
 * 5. In another terminal, trigger a test payment:
 *    stripe trigger charge.succeeded
 *    stripe trigger checkout.session.completed
 *
 * ### Option 2: Using Stripe Dashboard Test Events
 * 1. In Stripe Dashboard → Developers → Webhooks
 * 2. Click your endpoint
 * 3. Scroll to "Testing"
 * 4. Choose an event type
 * 5. Click "Send test webhook"
 *
 * ============================================================================
 * WEBHOOK EVENTS HANDLED
 * ============================================================================
 *
 * 1. checkout.session.completed
 *    - Triggered when: Customer completes Stripe checkout
 *    - Action: Create booking in database
 *    - Booking.paid = true
 *
 * 2. charge.succeeded
 *    - Triggered when: Charge successfully processes
 *    - Action: Log charge ID, update booking status
 *
 * 3. charge.failed
 *    - Triggered when: Charge fails
 *    - Action: Update booking with failure reason
 *    - Booking.paid = false
 *
 * 4. payment_intent.succeeded
 *    - Triggered when: Payment intent completes
 *    - Action: Update booking with payment intent ID
 *
 * 5. payment_intent.payment_failed
 *    - Triggered when: Payment intent fails
 *    - Action: Update booking with error details
 *
 * ============================================================================
 * SECURITY CONSIDERATIONS
 * ============================================================================
 *
 * ✓ Webhook signature verification (verifyStripeWebhook middleware)
 * ✓ Raw body parsing for webhook endpoint (app.js)
 * ✓ Webhook endpoint is public but signature-verified
 * ✓ Stripe session ID stored to prevent duplicate bookings
 * ✓ Booking creation idempotent (existing booking check)
 * ✓ User email validation from Stripe session
 * ✓ Tour existence validation before booking creation
 *
 * ============================================================================
 * PRODUCTION CHECKLIST
 * ============================================================================
 *
 * Before going live:
 * [ ] Switch Stripe to live mode (top-right toggle in dashboard)
 * [ ] Update to live API keys (sk_live_*, pk_live_*)
 * [ ] Create live webhook endpoint in Stripe Dashboard
 * [ ] Update .env.production with live webhook secret
 * [ ] Test with real payment (small amount)
 * [ ] Verify booking created in database
 * [ ] Enable HTTPS for webhook endpoint (Stripe requirement)
 * [ ] Set up email notifications for failed payments
 * [ ] Monitor webhook delivery in Stripe Dashboard
 *
 * ============================================================================
 * DEBUGGING
 * ============================================================================
 *
 * 1. Check webhook delivery:
 *    Stripe Dashboard → Developers → Webhooks → Your endpoint → Logs
 *
 * 2. View webhook request/response:
 *    Click event ID in logs to see full details
 *
 * 3. Check error logs:
 *    npm run start (development)
 *    Look for "Webhook Error:" or "Error handling" messages
 *
 * 4. Test webhook locally:
 *    stripe listen --forward-to localhost:3000/api/v1/bookings/webhook/stripe
 *    (This shows live webhook events while developing)
 *
 * ============================================================================
 */

// Export for documentation purposes
module.exports = {
  webhookEndpoint: '/api/v1/bookings/webhook/stripe',
  eventsHandled: [
    'checkout.session.completed',
    'charge.succeeded',
    'charge.failed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
  ],
  documentation: 'See comments above',
};
