# 🚀 Backend Server - Eternal Expeditions

> Express.js + MongoDB server with Stripe payments and real-time WebSocket support

## 📋 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp config.env.example config.env
# Edit config.env with your values

# Development mode
npm start

# Production mode
NODE_ENV=production npm start

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
```

## 🏗 Architecture

### Directory Structure

```
server/
├── app.js                    # Express app initialization
├── server.js                 # HTTP/Socket.io server entry point
├── config.env                # Environment variables
├── package.json              # Dependencies
│
├── controllers/
│   ├── authController.js     # User authentication
│   ├── userController.js     # User management
│   ├── tourController.js     # Tour CRUD & statistics
│   ├── reviewController.js   # Review management
│   ├── bookingController.js  # Booking + Stripe webhook
│   ├── errorController.js    # Global error handler
│   └── handlerFactory.js     # Reusable CRUD operations
│
├── models/
│   ├── userModel.js          # User schema
│   ├── tourModel.js          # Tour schema
│   ├── bookingModel.js       # Booking schema (10 fields)
│   └── reviewModel.js        # Review schema
│
├── routes/
│   ├── userRoutes.js         # User endpoints
│   ├── tourRoutes.js         # Tour endpoints
│   ├── bookingRoutes.js      # Booking endpoints
│   └── reviewRoutes.js       # Review endpoints
│
├── utils/
│   ├── config.js             # Config management
│   ├── appError.js           # Custom error class
│   ├── catchAsync.js         # Async error wrapper
│   ├── email.js              # Email service
│   ├── apiFeatures.js        # Query filters/sort/pagination
│   └── socket.js             # Socket.io server
│
├── middleware/
│   └── [auth/validation]
│
├── public/
│   └── img/                  # Static images
│
└── dev-data/
    └── data/                 # Sample data for seeding
```

## 🔌 API Endpoints

### Authentication

```
POST   /api/v1/users/signup               - Register user
POST   /api/v1/users/login                - Login user
POST   /api/v1/users/logout               - Logout user
POST   /api/v1/users/forgotPassword       - Request password reset
PATCH  /api/v1/users/resetPassword/:token - Reset password
PATCH  /api/v1/users/updateMyPassword     - Change password (protected)
GET    /api/v1/users/me                   - Get current user (protected)
```

### Users (Admin)

```
GET    /api/v1/users                     - Get all users (admin)
GET    /api/v1/users/:id                 - Get user by ID (admin)
PATCH  /api/v1/users/:id                 - Update user (admin)
DELETE /api/v1/users/:id                 - Delete user (admin)
```

### Tours

```
GET    /api/v1/tours                     - Get all tours (with filtering)
GET    /api/v1/tours/top-5-cheap         - Get top 5 cheapest tours
GET    /api/v1/tours/monthly-plan/:year  - Get monthly statistics (guide)
GET    /api/v1/tours/:id                 - Get tour by ID
POST   /api/v1/tours                     - Create tour (guide/admin)
PATCH  /api/v1/tours/:id                 - Update tour (owner/admin)
DELETE /api/v1/tours/:id                 - Delete tour (owner/admin)
POST   /api/v1/tours/:id/upload-images   - Upload images (owner/admin)
```

### Reviews

```
GET    /api/v1/reviews                   - Get all reviews
POST   /api/v1/tours/:tourId/reviews     - Create review (user)
PATCH  /api/v1/reviews/:id               - Update review (owner)
DELETE /api/v1/reviews/:id               - Delete review (owner/admin)
```

### Bookings

```
GET    /api/v1/bookings                  - Get all bookings (admin)
GET    /api/v1/bookings/my-bookings      - Get user's bookings (user)
POST   /api/v1/bookings                  - Create booking (admin/manual)
GET    /api/v1/bookings/:id              - Get booking
PATCH  /api/v1/bookings/:id              - Update booking
DELETE /api/v1/bookings/:id              - Delete booking (admin)
GET    /api/v1/bookings/checkout-session/:tourId - Stripe checkout (user)
POST   /api/v1/bookings/webhook/stripe   - Stripe webhook handler
```

## 💳 Stripe Payment System

### Three Booking Paths

1. **Production**: Stripe webhook → booking created → WebSocket event
2. **Development**: Booking created immediately (no webhook wait)
3. **Manual**: Admin creates booking via form

### Webhook Events

- `checkout.session.completed`: Create booking, emit WebSocket
- `charge.succeeded`: Update status to succeeded
- `charge.failed`: Update status to failed, store reason

### Signature Verification

- Uses HMAC-SHA256 signature verification
- Validates `stripe-signature` header

## 🔄 WebSocket Real-Time Updates

**File**: `/server/utils/socket.js`

- Client registers with `registerUser` event
- Joins room: `user-{userId}`
- Server emits `bookingStatusChanged` on updates
- Payload: `{ bookingId, sessionId, status, paymentMethod, failureReason }`

## 📊 Booking Model Schema

### 10 Fields (with Stripe Tracking)

```javascript
{
  // Core Fields
  tour: ObjectId (required, ref: Tour),
  user: ObjectId (required, ref: User),
  price: Number (required),
  createdAt: Date (indexed),
  paid: Boolean (default: false, synced with stripePaymentStatus),

  // Stripe Payment Fields
  stripeSessionId: String (unique, sparse, indexed),
  stripeChargeId: String (sparse),
  stripePaymentIntentId: String (sparse),
  stripePaymentStatus: String (
    enum: ['pending', 'succeeded', 'failed', 'canceled'],
    default: 'pending',
    indexed
  ),
  paymentMethod: String (
    enum: ['card', 'bank_transfer', 'wallet', 'other'],
    default: 'card'
  ),
  failureReason: String (optional, populated on failed payment)
}
```

### Field Sync Logic

- `paid` ↔ `stripePaymentStatus` auto-sync
- Ensures consistency across webhook, admin, dev modes

## 🔒 Security Features

### Middleware Stack

1. **Helmet** - HTTP security headers
2. **CORS** - Cross-origin with credentials
3. **Rate Limiting** - 100 req/hour from same IP
4. **Stripe Webhook** - Raw body (no JSON parsing)
5. **Body Parser** - JSON & URL-encoded (10kb limit)
6. **Cookie Parser** - Secure cookies
7. **MongoDB Sanitize** - NoSQL injection prevention
8. **XSS Clean** - XSS attack prevention
9. **HPP** - Parameter pollution prevention
10. **Compression** - Gzip responses

### Authentication

- JWT tokens (90-day expiration)
- HttpOnly cookies (XSS protection)
- Password hashing (bcryptjs, 12 rounds)
- Secure password reset (token expiration)

### Authorization

- Role-based access control (user, guide, admin)
- Protected routes (JWT verification)
- Resource ownership checks
- Admin-only endpoints

### Data Protection

- Request validation
- Input sanitization
- Error messages don't expose internals
- Sensitive data excluded from responses
