# 🎨 Frontend Client - Eternal Expeditions

> React 19 + Vite web application with real-time WebSocket updates and Stripe payments

## 📋 Quick Start

```bash
# Install dependencies
npm install

# Setup environment (optional - uses defaults)
touch .env.local
# VITE_API_URL=http://localhost:3000/api/v1
# VITE_BACKEND_URL=http://localhost:3000
# VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx

# Development
npm run dev

# Production build
npm run build
npm run build:prod

# Preview build
npm run preview

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
```

## 🏗 Architecture

### Directory Structure

```
client/
├── index.html                # HTML entry point
├── vite.config.js            # Vite configuration
├── eslint.config.js          # ESLint rules
├── package.json              # Dependencies
│
├── src/
│   ├── main.jsx              # React entry + providers
│   ├── App.jsx               # Routes & layout
│   ├── index.css             # Global styles + design tokens
│   │
│   ├── pages/ (20+ pages)
│   │   ├── HomePage.jsx
│   │   ├── ToursPage.jsx
│   │   ├── TourPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignUpPage.jsx
│   │   ├── AccountPage.jsx
│   │   ├── BookingListPage.jsx
│   │   ├── BookingDetailsPage.jsx
│   │   ├── BookingSuccessPage.jsx
│   │   ├── ManageBookings.jsx
│   │   ├── ManageReviews.jsx
│   │   ├── ManageUsers.jsx
│   │   ├── ManageTours.jsx
│   │   ├── BecomeGuidePage.jsx
│   │   ├── AboutPage.jsx
│   │   ├── ContactPage.jsx
│   │   ├── CareersPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   │   └── [CSS files for each page]
│   │
│   ├── components/ (Feature components)
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── TourCard.jsx
│   │   ├── BookingCard.jsx
│   │   ├── ReviewCard.jsx
│   │   ├── FilterPanel.jsx
│   │   ├── TourTable.jsx
│   │   ├── Toast.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── RoleBasedRoute.jsx
│   │   └── [CSS files for each]
│   │
│   ├── core-components/ (Reusable UI library)
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Image.jsx
│   │   ├── FormGroup.jsx
│   │   ├── LoadingState.jsx
│   │   ├── ErrorState.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── index.js
│   │   └── [CSS files for each]
│   │
│   ├── hooks/ (Custom React hooks)
│   │   ├── useAuth.js - Authentication context
│   │   ├── useForm.js - Form state management
│   │   ├── useModal.js - Modal/dialog state
│   │   ├── useQueries.js - React Query data fetching
│   │   └── index.js
│   │
│   ├── context/ (Context API)
│   │   ├── AuthContext.jsx - User authentication
│   │   └── authContextValue.js - Auth utilities
│   │
│   ├── store/ (Redux state)
│   │   ├── toastSlice.js - Toast notifications
│   │   ├── store.js - Redux store config
│   │   ├── hooks.js - Redux hooks
│   │   └── index.js
│   │
│   ├── utils/
│   │   ├── api.js - Axios with interceptors
│   │   ├── validators.js - Form validation
│   │   ├── tourValidation.js - Tour-specific validation
│   │   ├── mapbox.js - Mapbox integration
│   │   └── errorHandling.js - Error utilities
│   │
│   └── assets/
│       └── icons/ - Icon files
│
├── public/
│   └── img/ - Static images
│
└── .env.local - Environment variables (optional)
```

## 🎨 Component Structure

### Pages (20+ Full-Page Components)

**Public Pages**:
- `HomePage` - Landing page with featured tours
- `ToursPage` - Tour catalog with filtering
- `TourPage` - Tour details with map & reviews
- `LoginPage` - User authentication
- `SignUpPage` - User registration
- `ForgotPasswordPage` - Password recovery
- `ResetPasswordPage` - Password reset
- `AboutPage` - About the platform
- `CareersPage` - Careers opportunities
- `ContactPage` - Contact form
- `BecomeGuidePage` - Guide application
- `NotFoundPage` - 404 error

**Protected Pages**:
- `AccountPage` - User profile management
- `BookingListPage` - View user bookings
- `BookingDetailsPage` - Booking details
- `BookingSuccessPage` - Post-payment confirmation with real-time updates

**Admin/Guide Pages**:
- `ManageTours` - Create/edit tours
- `TourFormPage` - Tour form
- `TourStatsPage` - Tour statistics
- `ManageBookings` - Booking management with payment fields
- `ManageReviews` - Review moderation
- `ManageUsers` - User management
- `GuideMonthlyPlanPage` - Monthly statistics

### Core Components (Reusable UI Library)

**Buttons & Input**:
- `Button` - Primary, secondary, text variants
- `FormGroup` - Input with label & error
- `Card` - Container with header/footer

**Display**:
- `Image` - Lazy-loaded images
- `LoadingState` - Loading spinner
- `ErrorState` - Error display
- `ConfirmDialog` - Modal confirmation

**Layout**:
- `Header` - Navigation bar
- `Footer` - Footer section
- `ErrorBoundary` - Error fallback
- `RoleBasedRoute` - Protected routes

### Feature Components

- `TourCard` - Tour listing card
- `BookingCard` - Booking display with payment status
- `ReviewCard` - Review display
- `FilterPanel` - Search/filter controls
- `TourTable` - Admin data table
- `Toast` - Notification toasts

## 🔌 Real-Time Features

**File**: `/src/pages/BookingSuccessPage.jsx`

- Socket.io connection on mount
- Emits `registerUser` with user ID  
- Listens for `bookingStatusChanged` events
- Updates UI with toast notifications

**Payment Status Badge**:
- Green: Paid (succeeded)
- Red: Failed
- Yellow: Pending

## 💳 Payment Integration

### Stripe Setup

**Environment Variables**:
```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx (test) or pk_live_xxxxx (prod)
```

### Booking Flows

**Stripe Checkout**: Click → Payment → Redirect → WebSocket → Real-time update

**Admin Manual**: Form → Create → Visible in list

### ManageBookings Form

- `tour`, `user`, `price` (auto-populated)
- `paid`: Checkbox
- `paymentMethod`: card | bank_transfer | wallet | other

## 🎯 State Management

### Redux (Redux Toolkit)

**Store**: `/src/store/store.js`

**Slices**:
- `toastSlice` - Toast notifications (addToast, removeToast)
- Global UI state management

**Usage**:
```javascript
const { addToast } = useToasts();
addToast('Success!', 'success');
```

### React Query

**File**: `/src/hooks/useQueries.js`

- Server state caching (10 min stale time)
- Optimistic updates & cache invalidation
- Hooks: useTours, useMyBookings, useCreateBookingMutation, and 20+

### Context API

**AuthContext**: Provides `user`, `isAuthenticated`, `login`, `logout`, `token`

## 🔒 Security & Authorization

### Protected Routes

- Authenticated users: `<ProtectedRoute>`
- Role-based: `<RoleBasedRoute requiredRole="admin">`

### Authentication

- JWT in headers via Axios interceptors
- Auto-logout on 401 (token expired)
- HttpOnly cookies for XSS protection

## 🎨 Styling

### Design System

**File**: `/src/index.css`

- CSS variables for colors, spacing, radius, shadows, typography
- Breakpoints: 640px, 768px, 1024px, 1280px
- Mobile-first, Flexbox & Grid

### Component Styling

Each component has its own CSS file (BEM methodology):
```
ComponentName.jsx  → ComponentName.css
Button.jsx         → Button.css
TourCard.jsx       → TourCard.css
```

## 🚀 Production Build

### Build Optimizations

- Code splitting, tree shaking, minification
- Image optimization, asset compression

### Output

```
dist/
├── index.html
├── assets/
│   ├── index-xxxxx.js (main bundle)
│   ├── style-xxxxx.css (global styles)
│   └── [component chunks]
└── [images & other assets]
```
