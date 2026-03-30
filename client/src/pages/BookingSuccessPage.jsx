import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
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

      // Process payment based on environment
      if (import.meta.env.MODE === 'development') {
        // DEVELOPMENT MODE: Booking created immediately on backend
        processPaymentDev();
      } else {
        // PRODUCTION MODE: Wait for webhook to create booking
        processPaymentProd();
      }
    };

    const processPaymentDev = async () => {
      try {
        // In development, booking is created immediately when checkout session is created
        // Just fetch and display it
        const response = await api.get('/bookings/my-bookings');
        const bookings = response.data.data.bookings;
        const booking = bookings.find((b) => b.stripeSessionId === sessionId);

        if (!isMounted) return;

        if (booking) {
          updateBookingDisplay(booking);
          setStatus('success');
          addToast('Payment successful! Your booking is confirmed.', 'success');
        } else {
          // Should not happen in dev, but fallback
          setStatus('error');
          addToast('Booking not found. Please check your bookings.', 'error');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching booking (dev):', err);
        setStatus('error');
        addToast('Failed to load booking details. Please try again.', 'error');
      }
    };

    const processPaymentProd = async () => {
      try {
        // In production, webhook creates booking asynchronously
        // Query for it with retry logic, and listen via Socket.io for updates
        const response = await api.get('/bookings/my-bookings');
        const bookings = response.data.data.bookings;
        const booking = bookings.find((b) => b.stripeSessionId === sessionId);

        if (!isMounted) return;

        if (booking) {
          updateBookingDisplay(booking);
        } else {
          // Webhook hasn't processed yet - show pending state and listen via Socket.io
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
          setStatus('pending');
          addToast('Payment received! Your booking is being processed via webhook.', 'info');

          // Setup Socket.io for webhook updates
          setupWebsocket();
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching booking (prod):', err);
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
        // Invalidate bookings queries so they fetch fresh data
        queryClient.invalidateQueries({ queryKey: ['myBookings'] });
        queryClient.invalidateQueries({ queryKey: ['allBookings'] });
      } else if (booking.stripePaymentStatus === 'failed') {
        setStatus('error');
        addToast(`Payment failed: ${booking.failureReason || 'Unknown error'}`, 'error');
      } else {
        setStatus('success');
        addToast('Payment received! Your booking is being processed.', 'success');
      }
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

          // Show toast notification based on new status
          if (data.paymentStatus === 'succeeded') {
            addToast('💚 Payment confirmed! Your booking is complete.', 'success');
            setStatus('success');
            // Invalidate queries to fetch fresh booking data
            queryClient.invalidateQueries({ queryKey: ['myBookings'] });
            queryClient.invalidateQueries({ queryKey: ['allBookings'] });
          } else if (data.paymentStatus === 'failed') {
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
            {bookingData?.tourName && (
              <div className="detail-row">
                <span className="detail-label">Tour</span>
                <span className="detail-value">{bookingData.tourName}</span>
              </div>
            )}

            {bookingData?.amount && (
              <div className="detail-row">
                <span className="detail-label">Amount Paid</span>
                <span className="detail-value detail-amount">
                  $
                  {typeof bookingData.amount === 'number'
                    ? bookingData.amount.toFixed(2)
                    : bookingData.amount}
                </span>
              </div>
            )}

            {bookingData?.paymentStatus && (
              <div className="detail-row">
                <span className="detail-label">Payment Status</span>
                <span className="detail-value detail-status">{bookingData.paymentStatus}</span>
              </div>
            )}

            {bookingData?.paymentMethod && (
              <div className="detail-row">
                <span className="detail-label">Payment Method</span>
                <span className="detail-value">{bookingData.paymentMethod}</span>
              </div>
            )}

            {bookingData?.date && (
              <div className="detail-row">
                <span className="detail-label">Booked On</span>
                <span className="detail-value">{bookingData.date}</span>
              </div>
            )}

            {bookingData?.tourStartDate && (
              <div className="detail-row">
                <span className="detail-label">Tour Starts</span>
                <span className="detail-value">{bookingData.tourStartDate}</span>
              </div>
            )}

            {bookingData?.sessionId && (
              <div className="detail-row">
                <span className="detail-label">Session ID</span>
                <span className="detail-value detail-code">{bookingData.sessionId}</span>
              </div>
            )}

            {bookingData?.failureReason && (
              <div className="detail-row detail-row--warning">
                <span className="detail-label">Note</span>
                <span className="detail-value">{bookingData.failureReason}</span>
              </div>
            )}
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
