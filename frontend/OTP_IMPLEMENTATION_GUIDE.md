# OTP Authentication Implementation Guide

## Overview

Your project now has complete SMS OTP authentication integrated with the **2factor.in API**. **OTP verification is used during LOGIN**, not registration.

---

## 🎯 What's Been Implemented

### 1. **OTP Service Module** (`src/utils/otpService.js`)

Core utility functions for OTP handling:

- `generateOTP()` - Generates random 6-digit OTP
- `sendOTP(phone, otp)` - Sends OTP via SMS using 2factor.in API
- `formatPhoneNumber(phone)` - Formats phone numbers with country codes
- `verifyOTP(phone, sessionId, otp)` - Verifies submitted OTP
- `isValidOTP(otp)` - Validates OTP format
- `isOTPExpired(expiryTime)` - Checks if OTP expired

### 2. **Updated Components**

#### **Register.jsx** (SIMPLIFIED)

- Validates user input (name, email, phone, password)
- **Creates account directly** - No OTP required during registration
- Stores user data in localStorage
- Redirects to Login page

#### **Login.jsx** (OTP ENABLED)

- **Two login options**: Email or Mobile OTP
- **Email Tab**: Traditional email + password login
- **Mobile OTP Tab**:
  - Enter phone number
  - Send OTP to phone via SMS (using 2factor.in API)
  - Enter 6-digit OTP to verify
  - Login with phone number
  - 30-second timer
  - Resend OTP option

#### **AuthContext.jsx** (Already supports this)

- `loginWithPhone(phone, name)` - Authenticates user with phone
- `loginWithEmail(email, name)` - Authenticates user with email
- Persists authentication in localStorage

#### **OtpVerification.jsx** (DEPRECATED - No longer used)

- This component is no longer needed
- OTP verification now happens in the Login page

---

## 🔑 API Integration

### API Details

```
Service: 2factor.in
API Key: 354d27f2-fdd2-11eb-a13b-0200cd936042
Endpoint: https://2factor.in/API/V1/{api_key}/SMS/{phone}/{otp}/anyhelp
Method: GET
Response: {"Status":"Success","Details":"session_id"}
```

### Example Request

```
https://2factor.in/API/V1/354d27f2-fdd2-11eb-a13b-0200cd936042/SMS/+91-9876543210/123456/anyhelp
```

### Phone Number Format

- Must include country code (e.g., +91 for India)
- Service automatically formats phone numbers
- Accepts: `9876543210`, `0-9876543210`, `+91-9876543210`, `919876543210`

---

## 📱 User Flow

### Registration Flow (Simplified)

1. User fills registration form (First name, Last name, Email, Phone, Password)
2. Form validation occurs
3. On submit:
   - Account created immediately
   - User data stored in localStorage
   - User redirected to Login page

### Login with Email Flow

1. User goes to Login page → `/login`
2. Click "📧 Email" tab
3. Enter email and password
4. Click "Sign In" button
5. If credentials match registered user:
   - User is logged in
   - Redirected to `/dashboard`

### Login with Mobile OTP Flow

1. User goes to Login page → `/login`
2. Click "📱 Mobile OTP" tab
3. Enter phone number (10 digits)
4. Click "Send OTP" button
5. **API generates 6-digit OTP and sends via SMS**
6. User receives SMS with OTP code
7. User enters 6-digit OTP in the input field
8. Click "Verify & Login" button
9. **OTP is verified against generated OTP**
10. User is logged in
11. Redirected to `/dashboard`

### Resend OTP

- User can click "Resend OTP" button if didn't receive SMS
- New OTP is generated and sent
- 30-second timer restarts
- Can resend multiple times (limited by backend in production)

---

## 💻 Code Usage Examples

### Sending OTP

```javascript
import { sendOTP, generateOTP, formatPhoneNumber } from "../utils/otpService";

// Generate OTP
const otp = generateOTP(); // "123456"

// Format phone number
const phone = formatPhoneNumber("9876543210"); // "+919876543210"

// Send OTP
const result = await sendOTP(phone, otp);
if (result.status === "success") {
  console.log("OTP sent! Session ID:", result.sessionId);
} else {
  console.error("Failed to send OTP:", result.details);
}
```

### Verifying OTP (Current Implementation)

```javascript
// OTP is verified by comparing the entered OTP with the generated OTP
const enteredOtp = "123456";
const generatedOtp = "123456";

if (enteredOtp === generatedOtp) {
  // OTP is valid, login the user
  loginWithPhone(phone, userName);
} else {
  // OTP is invalid, show error
  console.error("Invalid OTP");
}
```

### Using AuthContext

```javascript
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      {user ? (
        <>
          <p>Hello, {user.name}</p>
          <p>Login Type: {user.type}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  );
}
```

---

## 🔒 Security Considerations

### Current Implementation (Client-side)

- ⚠️ Generated OTP stored in React state
- ⚠️ OTP verification done client-side
- ⚠️ No HTTPS enforcement in development

### Production Recommendations (IMPORTANT)

1. **Backend OTP Storage**: Store OTP on server with expiry

   ```javascript
   // Database schema
   {
     "phone": "+919876543210",
     "otp": "123456",
     "sessionId": "b3e8c128...",
     "expiresAt": "2026-05-19T10:30:00Z",
     "attempts": 0
   }
   ```

2. **Backend Verification**: Verify OTP on server

   ```javascript
   POST /api/verify-otp
   Headers: Content-Type: application/json
   Body: {
     "phone": "+919876543210",
     "otp": "123456"
   }
   Response: {
     "status": "success",
     "token": "jwt_token_here",
     "user": { ... }
   }
   ```

3. **Rate Limiting**:

   - Limit OTP generation to 5 per hour per phone
   - Limit verification attempts to 10 per OTP
   - Lock phone after 5 failed attempts for 15 minutes

4. **OTP Expiry**: Set 5-10 minute expiry on server

   - Client-side timer is just UI feedback
   - Server validates actual expiry

5. **HTTPS Only**: Always use HTTPS for OTP endpoints

6. **API Key Protection**:

   - Store API key in backend `.env` file
   - Never expose in frontend code
   - Rotate keys regularly

7. **Session Management**:
   - Generate JWT token after OTP verification
   - Store token in secure HTTP-only cookie
   - Use token for authenticated API requests

---

## 🚀 Deployment Setup

### Backend Setup (Node.js/Express Example)

1. **Install dependencies**:

```bash
npm install axios dotenv express cors
```

2. **Create `.env` file**:

```env
2FACTOR_API_KEY=354d27f2-fdd2-11eb-a13b-0200cd936042
OTP_EXPIRY_MINUTES=5
MAX_OTP_ATTEMPTS=10
MAX_RESEND_ATTEMPTS=3
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

3. **Implement backend endpoints**:

```javascript
// routes/auth.js
import axios from "axios";
import jwt from "jsonwebtoken";
import express from "express";

const app = express();

// Store OTPs in memory (use database in production)
const otpStore = new Map();

// Send OTP
app.post("/api/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send via 2factor.in API
    const response = await axios.get(
      `https://2factor.in/API/V1/${process.env.API_KEY}/SMS/+91${phone}/${otp}/anyhelp`
    );

    if (response.data.Status === "Success") {
      // Store OTP with expiry
      otpStore.set(phone, {
        otp,
        sessionId: response.data.Details,
        expiresAt:
          Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES) * 60 * 1000,
        attempts: 0,
      });

      res.json({
        status: "success",
        sessionId: response.data.Details,
        message: "OTP sent successfully",
      });
    } else {
      throw new Error(response.data.Details || "Failed to send OTP");
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Verify OTP
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Get stored OTP
    const otpData = otpStore.get(phone);

    if (!otpData) {
      return res.status(400).json({
        status: "error",
        message: "No OTP found for this phone",
      });
    }

    // Check if expired
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({
        status: "error",
        message: "OTP expired",
      });
    }

    // Check attempts
    if (otpData.attempts >= parseInt(process.env.MAX_OTP_ATTEMPTS)) {
      otpStore.delete(phone);
      return res.status(400).json({
        status: "error",
        message: "Too many verification attempts",
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      otpData.attempts++;
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP",
      });
    }

    // OTP verified
    otpStore.delete(phone);

    // Generate JWT token
    const token = jwt.sign(
      { phone, loginTime: new Date() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      status: "success",
      token,
      user: { phone },
      message: "OTP verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

export default app;
```

---

## 🧪 Testing the Implementation

### Test Cases

1. **Send OTP** - Should send successfully and show 30s timer
2. **Invalid Phone** - Should show error message
3. **Valid OTP** - Should verify and login
4. **Invalid OTP** - Should show error
5. **Expired OTP** - Should show "OTP expired" after 30 seconds
6. **Resend OTP** - Should send new OTP and reset timer
7. **Email Login** - Should verify email + password

### Manual Testing Steps

1. Start your frontend: `npm run dev`
2. Go to `http://localhost:5173/login`
3. Click "📱 Mobile OTP" tab
4. Enter phone: `9876543210`
5. Click "Send OTP" → Check SMS
6. Enter OTP from SMS
7. Click "Verify & Login"
8. Should redirect to `/dashboard`

### Test Phone Numbers (Format Examples)

- `9876543210`
- `+919876543210`
- `+91-9876543210`
- `0-9876543210`

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── utils/
│   │   └── otpService.js              ✨ NEW - OTP utilities
│   ├── pages/
│   │   ├── Register.jsx               📝 UPDATED - No OTP
│   │   ├── Login.jsx                  📝 UPDATED - OTP in login
│   │   └── OtpVerification.jsx        ❌ DEPRECATED - Not used
│   ├── context/
│   │   └── AuthContext.jsx            ✅ No changes needed
│   └── components/
└── package.json
```

---

## ⚙️ Configuration

### Modify API Key

Edit `src/utils/otpService.js`:

```javascript
const API_KEY = "your-new-api-key-here";
```

### Modify OTP Timer

Edit `Login.jsx`, in `handleSendOtp`:

```javascript
// Change from 30 to 300 seconds (5 minutes)
setOtpTimer(300);
```

---

## 🐛 Troubleshooting

| Problem                  | Solution                                                      |
| ------------------------ | ------------------------------------------------------------- |
| OTP not sending          | Check phone format, API key, 2factor.in account limits        |
| OTP verification failing | Ensure OTP is correct, not expired, and matches generated OTP |
| Timer not showing        | Check if OTP send was successful                              |
| Email login not working  | Verify email matches registered user's email                  |
| CORS errors              | Configure proxy in vite.config.js or use backend              |

---

## 📞 Support

For 2factor.in API issues:

- Website: https://2factor.in
- Documentation: https://2factor.in/API/
- Support: support@2factor.in

---

## ✅ Production Checklist

- [ ] Move API key to backend .env file
- [ ] Implement server-side OTP generation
- [ ] Implement server-side OTP storage (database)
- [ ] Implement server-side OTP verification
- [ ] Add rate limiting for OTP generation
- [ ] Add rate limiting for OTP verification
- [ ] Set OTP expiry to 5-10 minutes on backend
- [ ] Enable HTTPS for all endpoints
- [ ] Implement JWT token generation
- [ ] Add user account creation in database
- [ ] Test with multiple phone numbers
- [ ] Set up SMS delivery monitoring
- [ ] Add backup OTP delivery (email)
- [ ] Monitor SMS costs
- [ ] Document error codes
- [ ] Add comprehensive error handling
- [ ] Set up analytics

---

## 🎓 Next Steps

1. ✅ Implement backend server
2. ✅ Set up database for users and OTPs
3. ✅ Implement JWT token generation
4. ✅ Add email verification backup
5. ✅ Set up SMS delivery tracking
6. ✅ Test thoroughly before production
7. ✅ Deploy with HTTPS

---

**Happy coding! 🚀**
