# 🚀 Backend Server - Eternal Expeditions

> Backend API for Eternal Expeditions with Express, MongoDB, Stripe, and real-time Socket.io updates.

## 📋 Quick Start

```bash
cd server
npm install
npm start
```

### Scripts

- `npm run dev` — start server in development mode with nodemon
- `npm start` — start server in production mode
- `npm run lint` — run ESLint on server source files
- `npm run lint:fix` — automatically fix lintable issues
- `npm run format` — run Prettier formatting against JS/JSON/MD files

## 🧩 Server Architecture

### Directory structure

```
server/
├── app.js                    # Express app setup and middleware
├── server.js                 # HTTP and Socket.io server bootstrap
├── package.json              # Server dependencies and scripts
├── .eslintrc.json            # ESLint rules
├── .prettierrc               # Prettier configuration
├── .env.development          # Local development environment variables
├── .env.production           # Production environment variables
│
├── controllers/              # Route handlers and business logic
│   ├── authController.js
│   ├── bookingController.js
│   ├── errorController.js
│   ├── handlerFactory.js
│   ├── reviewController.js
│   ├── stripeWebhookController.js
│   ├── tourAnalyticsController.js
│   ├── tourController.js
│   └── userController.js
│
├── models/                   # Mongoose schemas
│   ├── bookingModel.js
│   ├── reviewModel.js
│   ├── tourModel.js
│   └── userModel.js
│
├── routes/                   # Route definitions
│   ├── bookingRoutes.js
│   ├── reviewRoutes.js
│   ├── tourRoutes.js
│   └── userRoutes.js
│
├── middleware/               # Request parsing and image processing
│   ├── tourDataMiddleware.js
│   └── tourImageMiddleware.js
│
├── utils/                    # Helpers and services
│   ├── apiFeatures.js
│   ├── appError.js
│   ├── authToken.js
│   ├── bookingUtils.js
│   ├── catchAsync.js
│   ├── config.js
│   ├── email.js
│   ├── fileUtils.js
│   ├── imageUtils.js
│   ├── objectUtils.js
│   ├── socket.js
│   └── uploadUtils.js
│
├── public/                   # Static files served by Express
│   └── img/
└── dev-data/                 # Sample data importers
    └── data/
```

## ⚙️ Environment Variables

The backend loads `.env.development` or `.env.production` depending on `NODE_ENV`. The config module validates these values:

- `FRONTEND_URL`
- `DATABASE`
- `DATABASE_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_COOKIE_EXPIRES_IN`
- `EMAIL_FROM`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_ENABLED` (`true` to send welcome emails; `false` keeps signup independent of email service)
- `SENDGRID_USERNAME`
- `SENDGRID_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GEMINI_API_KEY` (optional; enables the Eternal AI Assistant)
- `GEMINI_MODEL` (optional; defaults to `gemini-3.8-flash`)
- `MAX_FILE_SIZE`
- `ALLOWED_IMAGE_TYPES`
- `LOG_LEVEL`
- `ENABLE_REQUEST_LOGGING`
- `COOKIE_SECURE`
- `COOKIE_HTTP_ONLY`
- `COOKIE_SAME_SITE`

To enable the assistant locally, add `GEMINI_API_KEY=your-key` to
`server/.env.development` and restart the backend. Keep the key out of frontend
environment files and source control. `GEMINI_MODEL` is optional.

## 📦 Key Dependencies

- `express`
- `mongoose`
- `stripe`
- `socket.io`
- `bcryptjs`
- `jsonwebtoken`
- `dotenv`
- `helmet`
- `cors`
- `express-mongo-sanitize`
- `xss-clean`
- `multer`
- `sharp`
- `nodemailer`

## 🔌 API Endpoints

### Auth routes

- `POST /api/v1/users/signup`
- `POST /api/v1/users/login`
- `POST /api/v1/users/logout`
- `POST /api/v1/users/forgotPassword`
- `PATCH /api/v1/users/resetPassword/:token`
- `PATCH /api/v1/users/updateMyPassword`
- `GET /api/v1/users/me`

### User routes

- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id`
- `DELETE /api/v1/users/:id`

### Tour routes

- `GET /api/v1/tours`
- `GET /api/v1/tours/top-5-cheap`
- `GET /api/v1/tours/monthly-plan/:year`
- `GET /api/v1/tours/:id`
- `POST /api/v1/tours`
- `PATCH /api/v1/tours/:id`
- `DELETE /api/v1/tours/:id`
- `POST /api/v1/tours/:id/upload-images`

### Review routes

- `GET /api/v1/reviews`
- `GET /api/v1/reviews/:id`
- `POST /api/v1/tours/:tourId/reviews`
- `PATCH /api/v1/reviews/:id`
- `DELETE /api/v1/reviews/:id`

### Booking routes

- `GET /api/v1/bookings`
- `GET /api/v1/bookings/my-bookings`
- `GET /api/v1/bookings/:id`
- `POST /api/v1/bookings`
- `PATCH /api/v1/bookings/:id`
- `DELETE /api/v1/bookings/:id`
- `GET /api/v1/bookings/checkout-session/:tourId`
- `POST /api/v1/bookings/webhook/stripe`

### Eternal AI Assistant

- `POST /api/v1/eternal-ai-assistant/chat` — available to visitors and signed-in accounts for public tour questions; only authenticated `user` accounts are offered private booking lookups.
- The assistant uses Gemini function calling with public tour search and read-only booking tools. Booking tools are scoped to the authenticated user and cannot create, change, cancel, or pay for bookings. Guides and admins only receive public tour search.
- Booking filters include upcoming trips, payment status, and a calendar month (`YYYY-MM`).
- The browser keeps conversation history only in the current tab and sends the latest turns to the server with each prompt. The server does not persist chat history.
- Prompts and recent turns are sent to Gemini. Booking records are provided to Gemini only when the assistant calls a booking lookup tool. Configure `GEMINI_API_KEY` in server environment settings; do not expose it to the frontend. Keep free-tier demonstrations strictly synthetic; do not send real personal or confidential booking data to Gemini's unpaid tier.

## 💳 Stripe Integration

- The backend handles Stripe Checkout creation and webhook validation.
- `checkout.session.completed` creates bookings in production.
- In development mode, booking records are created immediately after checkout session creation.
- Webhook handlers also process `charge.succeeded`, `charge.failed`, `checkout.session.async_payment_failed`, and `checkout.session.async_payment_succeeded`.
- Webhook signature verification is performed using `stripe.webhooks.constructEvent`.

## 🔄 Real-Time Socket.io

- `server.js` initializes Socket.io alongside Express.
- Clients join rooms by user ID.
- Booking status updates are emitted using `emitBookingStatusChange`.
- Useful for booking lifecycle updates after Stripe webhooks.

## 🧠 Booking & Payment Data

The booking model includes fields for real-time tracking and Stripe metadata:

- `tour`
- `user`
- `price`
- `sessionId`
- `chargeId`
- `paymentIntentId`
- `paymentStatus`
- `paymentMethod`
- `failureReason`
- `createdAt`

## 🔒 Security and Validation

- JWT authentication with HTTP-only cookies
- Role-based access control for admin/guide/user flows
- Data sanitization and validation on request payloads
- Image upload restrictions and server-side resizing
- Global error handling via `errorController`

## 📚 Notes

- The server package is configured for both development and production via `NODE_ENV`.
- Use the root workspace README for overall repository instructions and links to the frontend and backend docs.

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
