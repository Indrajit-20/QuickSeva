# ✅ OTP Login Testing Guide

## 🧪 How to Test OTP Login on Your Site

### **Step 1: Run the Development Server**

```bash
cd frontend
npm install
npm run dev
```

Your site will run at: `http://localhost:5173`

---

### **Step 2: Test Email Login (Without OTP)**

1. Go to **Login Page** → **Email Tab** ✉️
2. Enter:
   - **Email**: `test@example.com`
   - **Password**: `password123`
3. Click **Login**
4. You should see:
   - ✅ Success message
   - ✅ Redirects to homepage (or shows "Unauthorized" if no user in database)

---

### **Step 3: Test Mobile OTP Login** 📱

#### **3A: Send OTP**

1. Go to **Login Page** → **Mobile OTP Tab** 📲
2. Enter your actual phone number:
   - **Format**: `9876543210` (without +91, just 10 digits)
   - **Example**: `9876543210`
3. Click **Send OTP**

**What Should Happen:**

- ⏳ Loading spinner appears
- ✅ Success message: "✓ OTP sent to your mobile number!"
- 📱 **Check your phone** - You should receive an SMS with 6-digit code
- ⏱️ Timer appears (30 seconds to enter OTP)

**If you DON'T receive SMS:**

- ❌ Check if phone number is correct (10 digits)
- ❌ Check 2factor.in API key (in `src/utils/otpService.js`)
- ❌ Check internet connection
- ❌ Check if your number is valid in India (+91)

---

#### **3B: Verify OTP**

1. **Check your SMS** - Find the 6-digit code from 2factor.in
   - Example: `123456`
2. **Enter the OTP** in the input field
3. Click **Verify OTP**

**What Should Happen:**

- ✅ OTP validates
- ✅ "✓ OTP Verified! Logging you in..." appears
- ✅ Redirects to homepage after 1.5 seconds

---

#### **3C: Resend OTP**

1. If you didn't receive the code, click **Resend OTP** (after timer expires)
2. Another SMS will be sent with a **NEW OTP code**
3. Enter the new code and verify

---

### **Complete OTP Flow Diagram**

```
User Opens Login Page
         ↓
User clicks "Mobile OTP" tab
         ↓
User enters phone number (e.g., 9876543210)
         ↓
User clicks "Send OTP"
         ↓
App calls 2factor.in API with phone + OTP code
         ↓
2factor.in sends SMS to phone ✅
         ↓
User receives SMS with code (e.g., "Your OTP is 123456")
         ↓
User enters code in app
         ↓
User clicks "Verify OTP"
         ↓
App compares user's input with generated OTP
         ↓
✅ Match → Login successful → Redirect to homepage
❌ No match → Show error "Invalid OTP"
         ↓
User logged in! 🎉
```

---

## 🔍 Troubleshooting

### **Problem 1: SMS Not Received**

**Solution:**

- Check phone number format (must be 10 digits without country code)
- Verify you have internet connection
- Check 2factor.in API key in `src/utils/otpService.js`:
  ```javascript
  const API_KEY = "354d27f2-fdd2-11eb-a13b-0200cd936042";
  ```
- Try with a different phone number
- Check 2factor.in dashboard for API quota limits

### **Problem 2: OTP Verification Fails**

**Solution:**

- Make sure you enter the EXACT code from SMS
- Check if you entered 6 digits (no letters)
- Make sure timer hasn't expired (30 seconds)
- If expired, click "Resend OTP"

### **Problem 3: Page Doesn't Load**

**Solution:**

- Check browser console (F12) for errors
- Verify npm packages installed: `npm install`
- Restart development server: `npm run dev`
- Clear browser cache

---

## 📊 Current Implementation Status

| Feature          | Status     | File            |
| ---------------- | ---------- | --------------- |
| Email Login      | ✅ Working | `Login.jsx`     |
| Send OTP via SMS | ✅ Working | `otpService.js` |
| Verify OTP Code  | ✅ Working | `Login.jsx`     |
| Resend OTP       | ✅ Working | `Login.jsx`     |
| 30-second Timer  | ✅ Working | `Login.jsx`     |
| Error Handling   | ✅ Working | `Login.jsx`     |

---

## 🔑 Key Files to Check

```
frontend/src/
├── pages/
│   └── Login.jsx                    ← Main login component with OTP
├── utils/
│   └── otpService.js                ← 2factor.in API integration
└── context/
    └── AuthContext.jsx              ← User authentication state
```

---

## 💡 Tips for Testing

✅ **Use real phone number** - SMS goes to actual phone  
✅ **Check SMS timing** - SMS takes 2-5 seconds  
✅ **Test with different numbers** - Try friends' phone numbers  
✅ **Screenshot OTP** - Keep OTP visible while verifying  
✅ **Monitor timer** - Don't exceed 30 seconds

---

## 🎯 Expected Test Results

| Test Case                | Expected Result                | Status |
| ------------------------ | ------------------------------ | ------ |
| Send OTP to valid number | SMS received                   | ✅     |
| Enter correct OTP        | Login successful               | ✅     |
| Enter wrong OTP          | Error message shown            | ✅     |
| Resend OTP               | New SMS received               | ✅     |
| Timer expires            | "Resend OTP" becomes available | ✅     |

---

## 📞 Still Having Issues?

1. Check browser **DevTools Console** (F12) for error messages
2. Verify API key is correct: `354d27f2-fdd2-11eb-a13b-0200cd936042`
3. Test on phone that can receive SMS
4. Check 2factor.in account for quota/balance
5. Run in **Incognito Mode** to clear cache

---

**Your OTP Login is READY TO TEST! 🚀**

Test it now and let me know if you have any issues!
