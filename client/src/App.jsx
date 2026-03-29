import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import RoleBasedRoute from './components/RoleBasedRoute';
import { getStripe } from './utils/stripe';

// Public Pages
import HomePage from './pages/HomePage';
import ToursPage from './pages/ToursPage';
import TopCheapToursPage from './pages/TopCheapToursPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import TourPage from './pages/TourPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AboutPage from './pages/AboutPage';
import CareersPage from './pages/CareersPage';
import ContactPage from './pages/ContactPage';
import BecomeGuidePage from './pages/BecomeGuidePage';
import NotFoundPage from './pages/NotFoundPage';
import GuideMonthlyPlanPage from './pages/GuideMonthlyPlanPage';

// User Pages
import AccountPage from './pages/AccountPage';
import BookingListPage from './pages/BookingListPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import BookingSuccessPage from './pages/BookingSuccessPage';

// Guide/Admin Pages
import ManageReviews from './pages/ManageReviews';
import ManageBookings from './pages/ManageBookings';
import ManageTours from './pages/ManageTours';
import TourFormPage from './pages/TourFormPage';
import TourStatsPage from './pages/TourStatsPage';

// Admin Pages
import ManageUsers from './pages/ManageUsers';

function App() {
  const [stripe, setStripe] = useState(null);

  useEffect(() => {
    const initStripe = async () => {
      try {
        const stripeInstance = await getStripe();
        setStripe(stripeInstance);
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
      }
    };

    initStripe();
  }, []);

  return (
    <ErrorBoundary>
      <Elements stripe={stripe || null}>
        <Router>
          <Toast />
          <Header />
          <Routes>
            {/* ============================================
              PUBLIC ROUTES
              ============================================ */}
            <Route path="/" element={<HomePage />} />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/top-5-cheap" element={<TopCheapToursPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/tour/:id" element={<TourPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/become-guide" element={<BecomeGuidePage />} />
            <Route path="/monthly-plan" element={<GuideMonthlyPlanPage />} />

            {/* ============================================
              USER PROTECTED ROUTES (require authentication)
              ============================================ */}

            {/* User Account Management */}
            <Route
              path="/me"
              element={
                <RoleBasedRoute allowedRoles={[]} fallback={<Navigate to="/login" replace />}>
                  <AccountPage />
                </RoleBasedRoute>
              }
            />

            {/* User Bookings - RESTful: GET /bookings/my-bookings */}
            <Route
              path="/my-tour-bookings"
              element={
                <RoleBasedRoute allowedRoles={[]} fallback={<Navigate to="/login" replace />}>
                  <BookingListPage />
                </RoleBasedRoute>
              }
            />
            {/* RESTful: GET /bookings/:id */}
            <Route
              path="/bookings/:bookingId"
              element={
                <RoleBasedRoute allowedRoles={[]} fallback={<Navigate to="/login" replace />}>
                  <BookingDetailsPage />
                </RoleBasedRoute>
              }
            />

            {/* Booking Success - Stripe Webhook Callback */}
            <Route
              path="/booking-success"
              element={
                <RoleBasedRoute allowedRoles={[]} fallback={<Navigate to="/login" replace />}>
                  <BookingSuccessPage />
                </RoleBasedRoute>
              }
            />

            {/* ============================================
              GUIDE + ADMIN ROUTES (restrictTo: admin, guide)
              ============================================ */}

            {/* Tour Management - RESTful: GET/POST/PATCH/DELETE /tours */}
            <Route
              path="/manage/tours"
              element={
                <RoleBasedRoute
                  allowedRoles={['admin', 'guide']}
                  fallback={<Navigate to="/" replace />}
                >
                  <ManageTours />
                </RoleBasedRoute>
              }
            />

            {/* Tour Form - Create/Edit */}
            <Route
              path="/manage/tours/new"
              element={
                <RoleBasedRoute
                  allowedRoles={['admin', 'guide']}
                  fallback={<Navigate to="/" replace />}
                >
                  <TourFormPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/manage/tours/:id/edit"
              element={
                <RoleBasedRoute
                  allowedRoles={['admin', 'guide']}
                  fallback={<Navigate to="/" replace />}
                >
                  <TourFormPage />
                </RoleBasedRoute>
              }
            />

            {/* Review Management - RESTful: GET/PATCH/DELETE /reviews */}
            <Route
              path="/manage/reviews"
              element={
                <RoleBasedRoute
                  allowedRoles={['admin', 'guide']}
                  fallback={<Navigate to="/" replace />}
                >
                  <ManageReviews />
                </RoleBasedRoute>
              }
            />

            {/* Booking Management - RESTful: GET/POST/PATCH/DELETE /bookings */}
            <Route
              path="/manage/bookings"
              element={
                <RoleBasedRoute
                  allowedRoles={['admin', 'guide']}
                  fallback={<Navigate to="/" replace />}
                >
                  <ManageBookings />
                </RoleBasedRoute>
              }
            />

            {/* Tour Statistics - RESTful: GET /tours/tour-stats */}
            <Route
              path="/manage/stats"
              element={
                <RoleBasedRoute
                  allowedRoles={['admin', 'guide']}
                  fallback={<Navigate to="/" replace />}
                >
                  <TourStatsPage />
                </RoleBasedRoute>
              }
            />

            {/* ============================================
              ADMIN ONLY ROUTES (restrictTo: admin)
              ============================================ */}

            {/* User Management - RESTful: GET/POST/PATCH/DELETE /users */}
            <Route
              path="/admin/users"
              element={
                <RoleBasedRoute allowedRoles={['admin']} fallback={<Navigate to="/" replace />}>
                  <ManageUsers />
                </RoleBasedRoute>
              }
            />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Footer />
        </Router>
      </Elements>
    </ErrorBoundary>
  );
}

export default App;
