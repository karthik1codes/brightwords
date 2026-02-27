# BrightWords

A comprehensive accessibility-focused web application with sign language learning features, subscription management, and payment integration.

## Features

- 🔐 **Google Authentication** - Secure login with Google Sign-In
- 🤟 **Sign Language Learning** - Interactive sign language translation and learning
- 💳 **Subscription Management** - Monthly and yearly subscription plans
- 💰 **Razorpay Payment Integration** - Secure payment processing with UPI, cards, and wallets
- ♿ **Accessibility Features** - Built with accessibility in mind
- 🎨 **Modern React UI** - Responsive and user-friendly interface

## Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Payment**: Razorpay
- **Authentication**: Google OAuth 2.0

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dsatm
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Configure backend environment**
   ```bash
   cd backend
   node setup-env.js
   ```
   This creates a `.env` file with Razorpay test keys.

### Running the Application

#### Option 1: Using Batch Files (Windows)

- **Start both servers**: Double-click `start-all.bat`
- **Start backend only**: Double-click `start-backend.bat` or `backend/start-server.bat`

#### Option 2: Manual Start

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:3000

## Project Structure

```
dsatm/
├── src/                    # React application source
│   ├── components/         # Reusable React components
│   ├── context/           # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   └── styles/            # CSS stylesheets
├── backend/               # Express API server
│   ├── server.js          # Main server file
│   └── subscriptions.db   # SQLite database
├── aws-augmentability-main/  # AWS AugmentAbility integration
└── dist/                  # Build output
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/subscription/create-order` - Create payment order
- `POST /api/subscription/verify-payment` - Verify payment
- `GET /api/subscription/status` - Get subscription status
- `GET /api/subscription/history` - Get subscription history

## Payment Testing

Use Razorpay test credentials:
- **Card**: `4111 1111 1111 1111` (any CVV, any expiry)
- **OTP**: `1234` (for 3D Secure)
- **UPI**: Any valid UPI ID works in test mode

## Development

- Frontend runs on port **8000**
- Backend runs on port **3000**
- Hot reload enabled for both frontend and backend

## License

See individual component licenses for details.


