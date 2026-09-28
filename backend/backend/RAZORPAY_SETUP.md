# JiffyKart Razorpay Setup

Zoho Payments has been replaced by Razorpay Standard Checkout. Zoho Books integration is intentionally preserved for invoicing.

## 1. Set environment variables

Never commit the secret to source code.

Windows PowerShell (current terminal):

```powershell
$env:RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxx"
$env:RAZORPAY_KEY_SECRET="your_test_secret"
```

Production server:

```text
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_secret
```

## 2. Start backend

```powershell
mvn spring-boot:run
```

## 3. Start frontend

```powershell
npm install
npm run dev
```

## Payment flow

1. Frontend creates the JiffyKart order.
2. POST `/api/razorpay/payment/initiate/{orderId}` creates a Razorpay order using the trusted DB total.
3. Frontend opens `https://checkout.razorpay.com/v1/checkout.js` with the returned Razorpay order ID and public Key ID.
4. After payment, frontend POSTs the Razorpay payment/order/signature values to `/api/razorpay/payment/verify`.
5. Backend verifies the HMAC SHA-256 signature with the Key Secret.
6. Only after successful verification is the JiffyKart order marked SUCCESS and the frontend cart cleared.

## Important

Use Test Mode keys first. Do not place `RAZORPAY_KEY_SECRET` in React, GitHub, screenshots, or `application.properties`.
