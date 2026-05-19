# 📚 Step 1: Quick Reference Card

## 🎯 What You Just Built

A **centralized, enterprise-grade API layer** with automatic token management.

---

## 📂 Two New Files

### File 1: `src/api/axiosConfig.js`

```javascript
// Configures Axios with Request Interceptor
// Makes every request include Authorization: Bearer {token}

// How to use:
import apiClient from "../api/axiosConfig";
await apiClient.get("/user/profile"); // Token auto-included!
```

### File 2: `src/api/authService.js`

```javascript
// Contains authentication API functions
// Uses the configured apiClient from axiosConfig.js

// How to use:
import { loginWithEmail } from "../api/authService";
const response = await loginWithEmail("email@example.com", "password");
```

---

## 🔍 How Request Interceptor Works

```javascript
// In axiosConfig.js:
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    // Attach token to every request automatically
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Result: No more manual Authorization headers! ✨
```

---

## 📊 Data Flow

```
Component Code
    ↓
authService.js (loginWithEmail, getCurrentUser, etc.)
    ↓
axiosConfig.js (Axios instance)
    ↓
REQUEST INTERCEPTOR ← Attaches token here!
    ↓
.NET Backend API
    ↓
RESPONSE (back through same route)
    ↓
Component receives data
```

---

## 💻 Usage Examples

### Example 1: Login

```javascript
import { loginWithEmail } from "../api/authService";

const handleLogin = async (email, password) => {
  const response = await loginWithEmail(email, password);

  // Save token
  localStorage.setItem("authToken", response.token);

  // Next requests automatically include token!
};
```

### Example 2: Get User Data (Token Auto-Included)

```javascript
import { getCurrentUser } from "../api/authService";

const handleGetUser = async () => {
  // This request automatically includes Authorization header
  // Thanks to Request Interceptor! ✨
  const user = await getCurrentUser();
  console.log("User:", user);
};
```

### Example 3: Custom Request

```javascript
import apiClient from "../api/axiosConfig";

const handleCustomRequest = async () => {
  // Token automatically included!
  const response = await apiClient.get("/custom-endpoint");
  return response.data;
};
```

---

## 🔑 Key Points

1. **Request Interceptor** runs before EVERY request
2. **Token** automatically attached from localStorage
3. **No manual work** needed in components
4. **One source of truth** for API configuration
5. **Easy to maintain** and extend

---

## 🚀 What Happens Next (Step 2)

We'll add a **Response Interceptor** to:

- ✅ Listen for 401 Unauthorized errors
- ✅ Clear localStorage when token expires
- ✅ Redirect user to login page
- ✅ Handle token refresh automatically

---

## 📝 Environment Variables

In `.env` file (create if doesn't exist):

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Or for production:

```env
REACT_APP_API_URL=https://your-api.com/api
```

---

## ✅ Step 1 Checklist

- ✅ Installed Axios
- ✅ Created `src/api/axiosConfig.js`
- ✅ Created `src/api/authService.js`
- ✅ Created `.env` with API URL
- ✅ Understand how Request Interceptor works
- ✅ Ready for Step 2!

---

**Ready for the Response Interceptor (Step 2)? Say "next"! 🚀**
