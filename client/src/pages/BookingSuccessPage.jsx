import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Button, Card, ErrorState, LoadingState } from '../core-components';
import { useToasts } from '../store/hooks';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import './BookingSuccessPage.css';

/**
 * BookingSuccessPage
 * Displays after successful Stripe payment checkout
 * Fetches and displays actual booking data
 * Listens for real-time status updates via WebSocket
 */
export default function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const { user } = useAuth();
  const [status, setStatus] = useState('loading');
  const [bookingData, setBookingData] = useState(null);
  const [socket, setSocket] = useState(null);

  const sessionId = searchParams.get('session_id');
  const isCancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    let isMounted = true;
    let hasRun = false;

    const setupPaymentState = () => {
      if (!isMounted || hasRun) return;
      hasRun = true;

      // Handle cancelled payment
      if (isCancelled) {
        setStatus('cancelled');
        addToast('Payment cancelled. Your booking was not completed.', 'warning');
        return;
      }

      // Validate session ID
      if (!sessionId) {
        setStatus('error');
        addToast('Invalid session. Please try booking again.', 'error');
        return;
      }

      // Process payment
      processPayment();
    };

    const processPayment = async () => {
      try {
        // In development mode, booking is created immediately
        // In production, booking is created via webhook
        // Query all bookings to find the one with this session ID
        const response = await api.get('/bookings/my-bookings');
        const bookings = response.data.data.bookings;
        
        // Find booking by session ID (works for both dev and production)
        const booking = bookings.find(b => b.stripeSessionId === sessionId);

        if (!isMounted) return;

        if (booking) {
          updateBookingDisplay(booking);
        } else {
          // Fallback: sometimes webhook takes time, assume pending
          setBookingData({
            sessionId,
            amount: 'Pending verification',
            date: new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          });
          setStatus('success');
          addToast('Payment received! Your booking is being processed.', 'success');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching booking:', err);
        setStatus('error');
        addToast('Failed to process payment. Please contact support.', 'error');
      }
    };

    const updateBookingDisplay = (booking) => {
      setBookingData({
        bookingId: booking._id,
        sessionId: booking.stripeSessionId,
        tourName: booking.tour?.name,
        amount: booking.price,
        date: new Date(booking.createdAt).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        paymentStatus: booking.stripePaymentStatus,
        paymentMethod: booking.paymentMethod,
        failureReason: booking.failureReason,
        tourStartDate: new Date(booking.tour?.startDates?.[0]).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });

      // Show appropriate message based on status
      if (booking.stripePaymentStatus === 'succeeded') {
        setStatus('success');
        addToast('Payment successful! Your booking is confirmed.', 'success');
      } else if (booking.stripePaymentStatus === 'failed') {
        setStatus('error');
        addToast(`Payment failed: ${booking.failureReason || 'Unknown error'}`, 'error');
      } else {
        setStatus('success');
        addToast('Payment received! Your booking is being processed.', 'success');
      }
    };

    // Initialize WebSocket connection if user is logged in
    if (user?._id) {
      const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      newSocket.on('connect', () => {
        console.log('[WebSocket] Connected, registering user:', user._id);
        newSocket.emit('registerUser', user._id);
      });

      // Listen for booking status changes
      newSocket.on('bookingStatusChanged', (data) => {
        console.log('[WebSocket] Booking status changed:', data);
        if (isMounted && data.sessionId === sessionId) {
          // Update booking data with new status
          setBookingData((prev) => ({
            ...prev,
            paymentStatus: data.status,
            failureReason: data.failureReason,
          }));

          // Show toast notification based on new status
          if (data.status === 'succeeded') {
            addToast('💚 Payment confirmed! Your booking is complete.', 'success');
            setStatus('success');
          } else if (data.status === 'failed') {
            addToast(`❌ Payment failed: ${data.failureReason || 'Please try again'}`, 'error');
            setStatus('error');
          }
        }
      });

      newSocket.on('disconnect', () => {
        console.log('[WebSocket] Disconnected');
      });

      newSocket.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
      });

      setSocket(newSocket);

      return () => {
        isMounted = false;
        newSocket.disconnect();
      };
    }

    setupPaymentState();

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isCancelled, user]);

  if (status === 'loading') {
    return (
      <LoadingState
        message="Processing your payment..."
        minHeight="100vh"
        showSpinner
      />
    );
  }

  if (status === 'cancelled') {
    return (
      <main className="main">
        <ErrorState
          title="Payment Cancelled"
          message="Your payment was cancelled. You can try booking again anytime."
          emoji="❌"
          actionLabel="Back to Tours"
          onAction={() => navigate('/tours')}
        />
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="main">
        <ErrorState
          title="Payment Error"
          message="Something went wrong while processing your payment. Please try again or contact support."
          emoji="⚠️"
          actionLabel="Back to Tours"
          onAction={() => navigate('/tours')}
        />
      </main>
    );
  }

  return (
    <main className="main">
      <div className="booking-success-page">
        <div className="success-container">
          {/* Success Header */}
          <div className="success-header">
            <div className="success-icon">✓</div>
            <h1 className="success-title">Payment Successful!</h1>
            <p className="success-subtitle">Your tour booking is now confirmed</p>
          </div>

          {/* Booking Confirmation Card */}
          <Card className="booking-confirmation-card">
            <div className="confirmation-content">
              {bookingData?.tourName && (
                <div className="confirmation-row">
                  <span className="confirmation-label">Tour:</span>
                  <span className="confirmation-value">{bookingData.tourName}</span>
                </div>
              )}

              <div className="confirmation-row">
                <span className="confirmation-label">Session ID:</span>
                <span className="confirmation-value confirmation-code">{bookingData?.sessionId}</span>
              </div>

              <div className="confirmation-row">
                <span className="confirmation-label">Amount Paid:</span>
                <span className="confirmation-value confirmation-amount">
                  ${typeof bookingData?.amount === 'number' ? bookingData.amount.toFixed(2) : bookingData?.amount}
                </span>
              </div>

              <div className="confirmation-row">
                <span className="confirmation-label">Booking Date:</span>
                <span className="confirmation-value">{bookingData?.date}</span>
              </div>

              {bookingData?.tourStartDate && (
                <div className="confirmation-row">
                  <span className="confirmation-label">Tour Starts:</span>
                  <span className="confirmation-value">{bookingData.tourStartDate}</span>
                </div>
              )}

              {bookingData?.paymentStatus && (
                <div className="confirmation-row">
                  <span className="confirmation-label">Payment Status:</span>
                  <span className="confirmation-value confirmation-status">
                    {bookingData.paymentStatus === 'succeeded' ? '✓' : ''} {bookingData.paymentStatus}
                  </span>
                </div>
              )}

              {bookingData?.paymentMethod && (
                <div className="confirmation-row">
                  <span className="confirmation-label">Payment Method:</span>
                  <span className="confirmation-value">{bookingData.paymentMethod}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Information Section */}
          <Card className="booking-info-card">
            <div className="info-content">
              <h2 className="info-title">What's Next?</h2>
              <ul className="info-list">
                <li>
                  <span className="info-number">1</span>
                  <span className="info-text">
                    Check your email for booking confirmation and details
                  </span>
                </li>
                <li>
                  <span className="info-number">2</span>
                  <span className="info-text">
                    View your booking in "My Bookings" to see tour details
                  </span>
                </li>
                <li>
                  <span className="info-number">3</span>
                  <span className="info-text">
                    Receive reminder emails before your tour departure
                  </span>
                </li>
                <li>
                  <span className="info-number">4</span>
                  <span className="info-text">
                    Have questions? Contact our support team anytime
                  </span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="success-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/my-tour-bookings')}
              className="action-btn"
            >
              View My Bookings
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/tours')}
              className="action-btn"
            >
              Browse More Tours
            </Button>
          </div>

          {/* Support Info */}
          <div className="support-info">
            <p>
              Need help? Contact us at{' '}
              <a href="mailto:support@eternal-expeditions.com">
                support@eternal-expeditions.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
