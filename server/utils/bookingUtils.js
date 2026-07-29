const mapStripePaymentStatus = (stripeStatus) => {
  const statusMap = {
    paid: 'succeeded',
    unpaid: 'pending',
    no_payment_required: 'succeeded',
  };

  return statusMap[stripeStatus] || 'pending';
};

const createManualBookingData = ({
  tour,
  user,
  price,
  paymentMethod,
  paymentStatus,
  sessionId,
}) => {
  const manualBookingId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    tour,
    user,
    price,
    paymentMethod: paymentMethod || 'other',
    sessionId: sessionId || manualBookingId,
    paymentStatus: paymentStatus || 'pending',
    chargeId: `manual_charge_${manualBookingId.substring(0, 16)}`,
    paymentIntentId: `manual_pi_${manualBookingId.substring(0, 16)}`,
  };
};

const isStripeEventSupported = (eventType) =>
  [
    'checkout.session.completed',
    'charge.succeeded',
    'charge.failed',
    'checkout.session.async_payment_failed',
    'checkout.session.async_payment_succeeded',
  ].includes(eventType);

module.exports = {
  mapStripePaymentStatus,
  createManualBookingData,
  isStripeEventSupported,
};
