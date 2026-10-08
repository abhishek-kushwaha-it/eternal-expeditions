import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import RoleBasedRoute from './components/RoleBasedRoute';
import { LoadingState } from './core-components';

// Public Pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ToursPage = lazy(() => import('./pages/ToursPage'));
const TopCheapToursPage = lazy(() => import('./pages/TopCheapToursPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const TourPage = lazy(() => import('./pages/TourPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const BecomeGuidePage = lazy(() => import('./pages/BecomeGuidePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const GuideMonthlyPlanPage = lazy(() => import('./pages/GuideMonthlyPlanPage'));

// User Pages
const AccountPage = lazy(() => import('./pages/AccountPage'));
const BookingListPage = lazy(() => import('./pages/BookingListPage'));
const BookingDetailsPage = lazy(() => import('./pages/BookingDetailsPage'));
const BookingSuccessPage = lazy(() => import('./pages/BookingSuccessPage'));

// Guide/Admin Pages
const ManageReviews = lazy(() => import('./pages/ManageReviews'));
const ManageBookings = lazy(() => import('./pages/ManageBookings'));
const ManageTours = lazy(() => import('./pages/ManageTours'));
const TourFormPage = lazy(() => import('./pages/TourFormPage'));
const TourStatsPage = lazy(() => import('./pages/TourStatsPage'));

// Admin Pages
const ManageUsers = lazy(() => import('./pages/ManageUsers'));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Toast />
        <Header />
        <Suspense fallback={<LoadingState message="Loading page..." minHeight="60vh" />}>
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
        </Suspense>
        <Footer />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
