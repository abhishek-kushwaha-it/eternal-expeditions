# 🌍 Eternal Expeditions - Adventure Tour Booking Platform

> A full-stack web application for discovering, booking, and managing adventure tours worldwide. **Production-ready** with Stripe payment integration and real-time WebSocket updates.

## 📌 Overview

Eternal Expeditions is a comprehensive adventure tour booking platform that connects travelers with unforgettable experiences. Users can browse, book, and review tours; guides can create and manage tours; admins oversee the entire platform.

### Key Features
- 🌐 Browse & search adventure tours with advanced filtering
- 💳 Secure payment processing with **Stripe integration**
- ⭐ User reviews and ratings system
- 🗺️ Interactive maps with Mapbox
- 🔐 Role-based access control (user, guide, admin)
- 🔄 **Real-time updates with WebSocket** (Socket.io)
- 📱 Fully responsive design

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Backend** | Node.js, Express.js, MongoDB, Socket.io v4.8 |
| **Frontend** | React 19, Vite, React Router, Redux, React Query |
| **Payment** | Stripe API with webhook signature verification |
| **Real-time** | Socket.io for bidirectional communication |
| **Security** | JWT, bcryptjs, Helmet, CORS, Rate Limiting |
| **Other** | Mapbox, SendGrid, Sharp, ESLint |

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0 (recommended: 18+)
- MongoDB (local or Atlas)
- Stripe account for payment processing

### Backend Setup
```bash
git clone <repository-url>
cd eternal-expeditions
npm install
cp config.env.example config.env
# Edit config.env with your credentials
npm start
# Server runs on http://localhost:3000
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

**For detailed setup instructions**, see [`server/README.md`](./server/README.md) and [`client/README.md`](./client/README.md)

## 📂 Project Structure

```
eternal-expeditions/
├── server/               # Backend (Node.js + Express + MongoDB)
│   ├── README.md        # Detailed backend documentation ⭐
│   ├── controllers/     # Business logic
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── utils/           # Utility functions (Socket.io, email, etc.)
│   └── config.env       # Environment variables
│
└── client/              # Frontend (React + Vite)
    ├── README.md        # Detailed frontend documentation ⭐
    ├── src/
    │   ├── pages/       # Page components
    │   ├── components/  # Reusable components
    │   ├── hooks/       # Custom React hooks
    │   ├── context/     # Context API
    │   ├── store/       # Redux state
    │   └── utils/       # Utilities
    └── vite.config.js   # Vite configuration
```

## 🔄 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT TIER (Browser)                            │
│  React 19 + Vite | React Router | Redux + React Query               │
│  Pages: 20+ | Components: 30+ | Real-time WebSocket listeners       │
└────────────────────┬────────────────────┬────────────────────────────┘
                     │ REST API           │ WebSocket
                     ↓ (HTTPS/HTTP)       ↓ (ws://)
┌─────────────────────────────────────────────────────────────────────┐
│                   API TIER (Express.js + Socket.io)                 │
│  REST API v1 with middleware stack | Stripe Webhook Handler         │
│  Routes: Tours, Users, Bookings, Reviews | 25+ Endpoints            │
│  Socket.io Server | Real-time event emission | 3 booking paths      │
└────────────────────┬────────────────────────────────────────────────┘
                     │ Mongoose
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│              DATABASE TIER (MongoDB Atlas)                          │
│  Collections: Users | Tours | Bookings | Reviews                    │
│  10-field Booking schema with Stripe tracking                       │
└─────────────────────────────────────────────────────────────────────┘
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│              PAYMENT TIER (Stripe API)                              │
│  Payment Processing | Webhook Events | Signature Verification       │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔒 Security Features

✅ JWT authentication (90-day expiration)  
✅ Password hashing (bcryptjs, 12 rounds)  
✅ CORS properly configured  
✅ Security headers (Helmet)  
✅ MongoDB injection prevention  
✅ XSS protection  
✅ Rate limiting  
✅ Role-based access control  

## 📚 Detailed Documentation

For comprehensive information, refer to:

- **[`server/README.md`](./server/README.md)** - Backend documentation
  - Installation & setup
  - Environment configuration
  - Complete API endpoints
  - Database models
  - Stripe implementation
  - WebSocket server setup
  - Security details
  - Deployment guide

- **[`client/README.md`](./client/README.md)** - Frontend documentation
  - Installation & setup
  - Project structure
  - Component library
  - State management
  - WebSocket integration
  - Payment flow
  - Development guide

## 🚀 Deployment

### Quick Deployment

**Backend** (Heroku/AWS):
```bash
npm install --production
NODE_ENV=production npm start
```

**Frontend** (Vercel/Netlify):
```bash
npm run build
# Deploy dist/ folder
```

## 🔮 Future Roadmap

- [ ] Two-Factor Authentication
- [ ] Advanced Analytics Dashboard
- [ ] Mobile App (React Native)
- [ ] Additional Payment Methods (PayPal, Apple Pay)
- [ ] TypeScript Migration
- [ ] Test Suite (Jest)
- [ ] Dark Mode

## 📞 Contact

For inquiries or collaboration:
- **Email**: [abhishek.kushwaha.it@gmail.com]
- **LinkedIn**: [https://www.linkedin.com/in/abhishekkushwahait/]
- **GitHub**: [https://github.com/abhishek-kushwaha-it]

## 📄 License

ISC License - See LICENSE file for details
