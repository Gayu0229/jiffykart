# JiffyKart Frontend - Razorpay

The checkout now uses Razorpay Standard Checkout.

No Razorpay Key Secret belongs in this frontend. The frontend requests a Razorpay order from the Spring Boot backend and receives only the public Key ID plus order details.

Run:

```powershell
npm install
npm run dev
```

Select **Razorpay (UPI / Card / NetBanking)** at checkout and click **PLACE ORDER**.
