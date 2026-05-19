# ⚡ Quick Reference - OTP Implementation

## 🚀 Getting Started

### Start Your App

```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

### Test Registration

1. Go to `/register`
2. Fill all fields
3. Click "Sign Up"
4. ✅ Account created, redirected to login

### Test Mobile OTP Login

1. Go to `/login`
2. Click "📱 Mobile OTP" tab
3. Enter phone: `9876543210`
4. Click "Send OTP"
5. Check your phone for SMS
6. Enter 6-digit OTP
7. Click "Verify & Login"
8. ✅ Logged in!

---

## 📂 File Locations

| Purpose                | File                          |
| ---------------------- | ----------------------------- |
| OTP Functions          | `src/utils/otpService.js`     |
| Registration           | `src/pages/Register.jsx`      |
| Login (with OTP)       | `src/pages/Login.jsx`         |
| Authentication Context | `src/context/AuthContext.jsx` |
| Full Documentation     | `OTP_IMPLEMENTATION_GUIDE.md` |
| What Changed           | `OTP_CHANGES_SUMMARY.md`      |

---

## 🔑 API Configuration

**Current API Key:**

```
354d27f2-fdd2-11eb-a13b-0200cd936042
```

**Located in:** `src/utils/otpService.js`

**Change API Key:**

```javascript
// File: src/utils/otpService.js
const API_KEY = "your-new-key-here";
```

---

## 🔄 Component Data Flow

```
Registration Page
    ↓
    Create Account (localStorage)
    ↓
Login Page (Two Options)
    ├─ Email Tab → Email + Password → Dashboard
    └─ Mobile OTP Tab
        ├─ Enter Phone
        ├─ Send OTP (otpService.sendOTP)
        ├─ Generate OTP (otpService.generateOTP)
        ├─ SMS sent via 2factor.in API
        ├─ Receive SMS
        ├─ Enter OTP
        ├─ Verify OTP (client-side comparison)
        ├─ Store in AuthContext (loginWithPhone)
        └─ Redirect to Dashboard
```

---

## 💻 Key Functions

### In OtpService.js

```javascript
// Generate random 6-digit OTP
generateOTP() → "123456"

// Format phone number
formatPhoneNumber("9876543210") → "+919876543210"

// Send OTP via SMS
sendOTP("+919876543210", "123456")
  → { status: "success", sessionId: "..." }

// Validate OTP format
isValidOTP("123456") → true
```

### In Login.jsx

```javascript
// Generate and send OTP
handleSendOtp() → Calls sendOTP()

// Verify OTP entered by user
handleVerifyOtp() → Compares with generated OTP

// Resend OTP (new code)
handleResendOtp() → Generates new OTP
```

### In AuthContext.jsx

```javascript
// Login with phone
loginWithPhone("+919876543210", "John Doe")

// Login with email
loginWithEmail("john@example.com", "John Doe")

// Get logged-in user
user → { type: "phone", phone: "+919876543210", name: "John Doe" }
```

---

## 🎨 UI Elements

### Login Page Tabs

```
┌─────────────────────────────────┐
│  [📧 Email]  [📱 Mobile OTP]   │ ← Click to switch
├─────────────────────────────────┤
│                                 │
│  Email/Password Form  OR        │
│  Phone + OTP Form               │
│                                 │
└─────────────────────────────────┘
```

### Mobile OTP Form

```
Step 1: Enter Phone
┌───────────────────┐
│ Mobile Number     │
│ [9876543210   ]   │
│ [Send OTP]        │
└───────────────────┘

Step 2: Enter OTP (after SMS)
┌───────────────────┐
│ Enter OTP         │
│ [123456]          │
│ [Verify & Login]  │
│ [Resend OTP]      │
│ Timer: 00:25      │
└───────────────────┘
```

---

## 🧪 Test Scenarios

| Test             | Steps                                            | Expected         |
| ---------------- | ------------------------------------------------ | ---------------- |
| Register & Login | 1. Register 2. Go to login 3. Email login        | ✅ Logged in     |
| Mobile OTP       | 1. Login 2. Mobile tab 3. Send OTP 4. Enter code | ✅ SMS + Login   |
| Invalid OTP      | 1. Send OTP 2. Enter wrong code                  | ❌ Error message |
| Expired OTP      | 1. Send OTP 2. Wait 30s 3. Enter code            | ❌ Expired error |
| Resend OTP       | 1. Send OTP 2. Click Resend                      | ✅ New SMS sent  |

---

## 📊 State Management

### Login Component State

```javascript
// Email login
emailForm: { email: "", password: "" }
emailErrors: {}
emailLoading: false

// Mobile OTP
mobileForm: { mobileNumber: "" }
otpSent: false
otpCode: ""
otpTimer: 30
otpTimerActive: true
sessionId: "..."
generatedOtp: "123456"
```

---

## 🔐 Security Checklist

### Current (Development)

- ✅ Real SMS API integration
- ✅ OTP validation
- ✅ Timer functionality
- ⚠️ Client-side verification

### TODO (Production)

- ⚠️ Backend OTP verification
- ⚠️ Database storage
- ⚠️ Rate limiting
- ⚠️ HTTPS enforcement
- ⚠️ JWT tokens
- ⚠️ Session management

---

## 🐛 Common Issues

| Issue                  | Solution                               |
| ---------------------- | -------------------------------------- |
| OTP not arriving       | Check phone format, API account limits |
| Can't login with email | Check if account was registered        |
| OTP says invalid       | Make sure you entered correct 6 digits |
| Timer stuck            | Refresh page, might be browser cache   |
| API errors             | Check API key in otpService.js         |

---

## 📞 Quick Links

- **2factor.in**: https://2factor.in
- **API Docs**: https://2factor.in/API/
- **SMS Tracking**: https://2factor.in/dashboard

---

## 🎯 Important Notes

1. **Phone Format**: Must be 10 digits

   - ✅ `9876543210`
   - ✅ `+919876543210`
   - ✅ `+91-9876543210`
   - ❌ `98765 43210` (with spaces)

2. **OTP Format**: Always 6 digits

   - Generated fresh each time
   - Expires after 30 seconds (UI timer)
   - Can resend unlimited times

3. **Registration Changes**:

   - ❌ No longer requires OTP
   - ✅ Immediate account creation
   - ✅ Direct redirect to login

4. **Login Changes**:
   - ✅ Added mobile OTP option
   - ✅ Email login still works
   - ✅ Can use either method

---

## 🚀 Deployment

### Development

```bash
npm run dev
# Runs at http://localhost:5173
```

### Production Build

```bash
npm run build
npm run preview
```

### With Backend

```bash
# Update API endpoints in otpService.js
# Point to your backend instead of direct 2factor.in
```

---

## 📝 Environment Variables (Backend)

```env
# .env file for backend
2FACTOR_API_KEY=354d27f2-fdd2-11eb-a13b-0200cd936042
OTP_EXPIRY_MINUTES=5
MAX_OTP_ATTEMPTS=10
JWT_SECRET=your_secret_key
```

---

**That's it! You're all set to use OTP authentication! 🎉**

For detailed setup, see `OTP_IMPLEMENTATION_GUIDE.md`
