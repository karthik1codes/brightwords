# BrightWords Subscription API

Backend API server for managing subscriptions and processing payments via Razorpay (UPI support included).

## Features

- ✅ Razorpay payment integration (supports UPI, cards, wallets, netbanking)
- ✅ Subscription management (Monthly/Yearly plans)
- ✅ Payment verification and security
- ✅ SQLite database for subscription storage
- ✅ RESTful API endpoints

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Razorpay

1. Sign up at [Razorpay Dashboard](https://razorpay.com/)
2. Get your **Key ID** and **Key Secret** from: Settings → API Keys
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your Razorpay credentials:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_key_secret_here
   PORT=3000
   ```

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns server status

### Create Payment Order
- **POST** `/api/subscription/create-order`
- Body: `{ plan, amount, currency, userEmail, userName }`
- Returns: `{ orderId, amount, currency, status }`

### Verify Payment
- **POST** `/api/subscription/verify-payment`
- Body: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, userEmail }`
- Returns: `{ success, message, subscription }`

### Check Subscription Status
- **GET** `/api/subscription/status?userEmail=user@example.com`
- Returns: `{ hasSubscription, subscription }`

### Get Subscription History
- **GET** `/api/subscription/history?userEmail=user@example.com`
- Returns: `{ subscriptions: [...] }`

## Payment Plans

- **Monthly**: ₹299/month (30 days)
- **Yearly**: ₹2,999/year (365 days) - Save 16%

## Testing with Razorpay

Razorpay provides test cards and UPI IDs for testing:

- **Test Cards**: Use cards starting with `4111` (success), `4012` (failure)
- **Test UPI IDs**: Use any UPI ID in test mode
- **More test credentials**: Check [Razorpay Test Cards](https://razorpay.com/docs/payments/test-cards/)

## Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use HTTPS in production** - Required for Razorpay payments
3. **Verify signatures** - All payments are verified using Razorpay signatures
4. **Store credentials securely** - Use environment variables, not hardcoded values

## Database

The API uses SQLite database (`subscriptions.db`) to store:
- User subscriptions
- Payment details
- Subscription status and dates

The database is automatically created on first run.

## Production Deployment

1. Set up environment variables on your hosting platform
2. Use a production database (PostgreSQL/MySQL) instead of SQLite
3. Enable HTTPS/SSL
4. Update CORS settings for your domain
5. Use Razorpay Live keys (not test keys)

## Support

For Razorpay integration issues, refer to:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Node.js SDK](https://github.com/razorpay/razorpay-node)



