# 🎨 Frontend Client - Eternal Expeditions

> React 19 + Vite frontend application for Eternal Expeditions, with Stripe checkout, real-time booking updates, and role-aware navigation.

## 📋 Quick Start

```bash
cd client
npm install
npm run dev
```

### Available Scripts

- `npm run dev` — start the Vite development server
- `npm run build` — build the production bundle
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint on the client source
- `npm run lint:fix` — auto-fix lintable issues
- `npm run format` — format source files with Prettier

## 🛠 Technology Stack

- React 19
- Vite
- React Router DOM
- Redux Toolkit + React Redux
- @tanstack/react-query
- Axios
- Stripe React SDK (`@stripe/react-stripe-js`)
- socket.io-client
- Mapbox GL
- ESLint and Prettier

## 📁 Project Structure

```
client/
├── public/                    # Static public assets and images
├── src/                       # React application source files
│   ├── assets/                # Icons and static image assets
│   ├── components/            # Feature-specific UI components
│   ├── core-components/       # Reusable UI primitives
│   ├── context/               # React context providers
│   ├── hooks/                 # Custom hooks for auth, forms, queries
│   ├── pages/                 # Page-level components
│   ├── store/                 # Redux state and slices
│   ├── utils/                 # API and utility helpers
│   ├── App.jsx                # Route definitions and layout
│   └── main.jsx               # App bootstrap and provider setup
├── package.json               # Frontend dependencies and scripts
├── vite.config.js             # Vite configuration and build settings
└── README.md                  # Frontend documentation
```

## 🔧 Frontend Behavior

### User workflows

- Browse tours and apply filters
- View individual tour details with map and reviews
- Sign up, log in, and manage account details
- Book tours via Stripe checkout
- View booking confirmation and status updates
- Write and manage reviews for booked tours

### Admin / guide workflows

- Create, update, and delete tours
- Upload tour images
- Manage bookings and reviews
- Manage users and access
- View guide monthly plan stats

## 🔌 Real-Time Interaction

- Socket.io connection is used for real-time booking updates
- The client registers the logged-in user and listens for `bookingStatusChanged`
- Booking status changes update the UI and trigger toast notifications

## 💳 Stripe Integration

- Payment flow uses Stripe Checkout
- The frontend uses `@stripe/react-stripe-js` for Stripe-specific components and hooks
- A complete booking lifecycle is supported through the backend webhook and socket events

## 🌐 Environment Variables

Set local variables in `.env.local` or Vite environment files:

- `VITE_API_URL` — backend API URL, e.g. `http://localhost:3000/api/v1`
- `VITE_BACKEND_URL` — backend base URL, e.g. `http://localhost:3000`
- `VITE_STRIPE_PUBLIC_KEY` — Stripe publishable key

## 📌 Key Files

- `src/main.jsx` — entry point and provider setup
- `src/App.jsx` — app routes and global layout
- `src/context/AuthContext.jsx` — auth provider and context logic
- `src/utils/api.js` — Axios API client and interceptors
- `src/pages/BookingSuccessPage.jsx` — post-payment flow and socket handling
- `src/components/RoleBasedRoute.jsx` — protected route wrapper

## 🧠 Notes

- Vite config includes gzip compression and production optimizations
- Build output is in `dist/`
- ESLint is configured for React, hooks, and Prettier compatibility

## 📚 Related Documentation

- [Root README](../README.md)
- [Server README](../server/README.md)
