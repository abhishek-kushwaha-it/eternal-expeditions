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
 * Displays after successful payment checkout
 * Fetches and displays actual booking data
 * Listens for real-time status updates via WebSocket
 */

// Helper: Handle payment status and show appropriate message
const handlePaymentStatus = (paymentStatus, failureReason, setStatus, addToast) => {
  if (paymentStatus === 'succeeded') {
    setStatus('success');
    addToast('💚 Payment confirmed! Your booking is complete.', 'success');
  } else if (paymentStatus === 'failed') {
    setStatus('error');
    addToast(`❌ Payment failed: ${failureReason || 'Please try again'}`, 'error');
  } else {
    setStatus('success');
    addToast('Payment received! Your booking is being processed.', 'success');
  }
};

// Helper: Format date to readable string
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// Helper: Render detail row consistently
const renderDetailRow = (label, value, valueClass = '', isWarning = false) => {
  if (!value) return null;
  return (
    <div className={`detail-row${isWarning ? ' detail-row--warning' : ''}`}>
      <span className="detail-label">{label}</span>
      <span className={`detail-value${valueClass ? ` ${valueClass}` : ''}`}>{value}</span>
    </div>
  );
};

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
  const isDev = import.meta.env.MODE === 'development';

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

      processPayment();
    };

    const processPayment = async () => {
      try {
        const response = await api.get('/bookings/my-bookings');
        const bookings = response.data.data.bookings;
        const booking = bookings.find((b) => b.sessionId === sessionId);

        if (!isMounted) return;

        if (booking) {
          // Booking found - update display and handle status
          updateBookingDisplay(booking);
        } else if (isDev) {
          // Dev mode: booking should exist
          setStatus('error');
          addToast('Booking not found. Please check your bookings.', 'error');
        } else {
          // Prod mode: webhook hasn't processed yet, show pending
          setBookingData({
            sessionId,
            amount: 'Pending verification',
            date: formatDate(new Date()),
          });
          setStatus('pending');
          addToast('Payment received! Your booking is being processed via webhook.', 'info');
          setupWebsocket();
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching booking:', err);
        setStatus('error');
        addToast('Failed to process payment. Please try again or contact support.', 'error');
      }
    };

    const updateBookingDisplay = (booking) => {
      setBookingData({
        bookingId: booking._id,
        sessionId: booking.sessionId,
        tourName: booking.tour?.name,
        amount: booking.price,
        date: formatDate(booking.createdAt),
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        failureReason: booking.failureReason,
        tourStartDate: formatDate(booking.tour?.startDates?.[0]),
      });

      // Handle payment status
      handlePaymentStatus(booking.paymentStatus, booking.failureReason, setStatus, addToast);
    };

    const setupWebsocket = () => {
      if (!user?._id) {
        console.warn('[WebSocket] User not logged in, skipping setup');
        return;
      }

      const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      newSocket.on('connect', () => {
        console.log('[WebSocket] Connected (production mode), registering user:', user._id);
        newSocket.emit('registerUser', user._id);
      });

      // Listen for booking status changes
      newSocket.on('bookingStatusChanged', (data) => {
        console.log('[WebSocket] Booking status changed:', data);
        if (isMounted && data.sessionId === sessionId) {
          // Update booking data with new status
          setBookingData((prev) => ({
            ...prev,
            paymentStatus: data.paymentStatus,
            failureReason: data.failureReason,
          }));

          // Reuse payment status handler for consistency
          handlePaymentStatus(data.paymentStatus, data.failureReason, setStatus, addToast);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('[WebSocket] Disconnected');
      });

      newSocket.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
      });

      setSocket(newSocket);
      return newSocket;
    };

    setupPaymentState();

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isCancelled, user?._id]);

  if (status === 'loading') {
    return <LoadingState message="Processing your payment..." minHeight="100vh" showSpinner />;
  }

  if (status === 'pending') {
    return (
      <LoadingState
        message="Payment received! Processing via webhook..."
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
      <div className="success-page">
        <div className="success-card">
          {/* Success Header */}
          <div className="success-header">
            <div className="success-checkmark">✓</div>
            <h1 className="success-title">Payment Confirmed</h1>
            <p className="success-subtitle">Your tour booking is reserved</p>
          </div>

          {/* Booking Details */}
          <div className="booking-details">
            {renderDetailRow('Tour', bookingData?.tourName)}
            {renderDetailRow(
              'Amount Paid',
              bookingData?.amount
                ? `$${typeof bookingData.amount === 'number' ? bookingData.amount.toFixed(2) : bookingData.amount}`
                : null,
              'detail-amount'
            )}
            {renderDetailRow('Payment Status', bookingData?.paymentStatus, 'detail-status')}
            {renderDetailRow('Payment Method', bookingData?.paymentMethod)}
            {renderDetailRow('Booked On', bookingData?.date)}
            {renderDetailRow('Tour Starts', bookingData?.tourStartDate)}
            {renderDetailRow('Session ID', bookingData?.sessionId, 'detail-code')}
            {bookingData?.failureReason &&
              renderDetailRow('Note', bookingData.failureReason, null, true)}
          </div>

          {/* Action Buttons */}
          <div className="success-actions">
            <Button
              variant="primary"
              onClick={() => navigate('/my-tour-bookings')}
              className="action-btn"
            >
              View My Bookings
            </Button>
            <Button variant="outline" onClick={() => navigate('/tours')} className="action-btn">
              Explore More Tours
            </Button>
          </div>

          {/* Info Footer */}
          <p className="success-footer">
            A confirmation email has been sent. Questions?{' '}
            <a href="mailto:support@eternal-expeditions.com" className="footer-link">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
