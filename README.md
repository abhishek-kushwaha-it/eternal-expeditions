# 🌍 Eternal Expeditions

> Full-stack MERN tour booking platform with Stripe payments, real-time updates, role-based access, and image upload support.

## 📌 Overview

Eternal Expeditions is a production-style travel booking application built as a monorepo with separate frontend and backend packages. It provides a user-facing tour marketplace, guide/admin management tools, Stripe checkout integration, and real-time booking updates using Socket.io.

## 🚀 What this app does

- Allows users to browse and filter tours
- Enables user registration, login, and account management
- Supports booking a tour with Stripe payment flow
- Sends booking status updates in real-time
- Lets users create and manage reviews
- Supports guide/admin tour creation and management
- Handles image upload and processing for tours and user profiles
- Uses JWT and role-based authentication for secure access control

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, React Redux, @tanstack/react-query |
| Backend | Node.js 18+, Express, MongoDB, Mongoose, Socket.io |
| Payments | Stripe Checkout, Stripe webhooks, payment status mapping |
| Auth | JWT, bcryptjs, cookies, role-based access control |
| Email | SendGrid / nodemailer email delivery |
| Images | Sharp image resizing, multer memory uploads |
| Security | Helmet, CORS, express-mongo-sanitize, xss-clean, rate limiting |
| Tooling | ESLint, Prettier, nodemon, vite-plugin-compression |

## 📁 Monorepo Structure

```
eternal-expeditions/
├── client/                    # Frontend application
│   ├── public/                # Static assets
│   ├── src/                   # React source code
│   ├── package.json
│   └── README.md
├── server/                    # Backend API and services
│   ├── controllers/           # Business logic
│   ├── models/                # MongoDB schemas
│   ├── routes/                # Express route definitions
│   ├── utils/                 # Helpers and services
│   ├── public/                # Static uploaded images
│   ├── package.json
│   └── README.md
├── package.json               # Root workspace scripts
└── README.md                  # This file
```

## 🧩 Workspace Scripts

From the repository root:

```bash
npm install
npm run dev
npm run lint
npm run lint:fix
npm run format
```

### Root workspace script details

- `npm run dev` - starts frontend and backend concurrently
- `npm run lint` - runs linting in both `client` and `server`
- `npm run lint:fix` - fixes lint issues across both packages
- `npm run format` - formats both packages with Prettier

## ⚙️ Client Setup

```bash
cd client
npm install
npm run dev
```

The frontend runs by default on `http://localhost:5173`.

## ⚙️ Server Setup

```bash
cd server
npm install
npm start
```

The backend runs by default on `http://localhost:3000`.

## 🔧 Environment Configuration

The backend uses `.env.development` and `.env.production` files. The server config module validates required variables such as:

- `FRONTEND_URL`
- `DATABASE`
- `DATABASE_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_COOKIE_EXPIRES_IN`
- `EMAIL_FROM`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `SENDGRID_USERNAME`
- `SENDGRID_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MAX_FILE_SIZE`
- `ALLOWED_IMAGE_TYPES`
- `LOG_LEVEL`
- `ENABLE_REQUEST_LOGGING`
- `COOKIE_SECURE`
- `COOKIE_HTTP_ONLY`
- `COOKIE_SAME_SITE`

## 📦 Frontend Details

- React 19 with Vite
- ESM package type
- `@reduxjs/toolkit`, `react-redux` for state management
- `axios` for API calls
- `socket.io-client` for live booking updates
- `@stripe/react-stripe-js` for Stripe payment UI
- `mapbox-gl` for map rendering

## 🧠 Backend Details

- Node.js 18+ and Express
- MongoDB with Mongoose
- `stripe` package for payments and webhook validation
- `socket.io` for real-time communication
- `sharp` for server-side image resizing
- `multer` upload middleware using memory storage
- `bcryptjs` for hashing user passwords

## 📚 Documentation Links

- [Client README](./client/README.md)
- [Server README](./server/README.md)

## 💡 Notes

This repository is designed as a complete full-stack learning application with separate client and server packages managed through npm workspaces. It is ready for local development and can be extended with unit tests, deployment automation, and additional payment providers.

