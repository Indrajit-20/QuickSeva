# 🔐 Step 1: Axios Configuration & Request Interceptor

## 📖 The Architectural Logic Explained

### The Problem We're Solving

**Before (Without centralized API):**

```javascript
// Login.jsx
const handleLogin = async (email, password) => {
  const token = localStorage.getItem("authToken");
  const response = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ← Repeated everywhere
    },
    body: JSON.stringify({ email, password }),
  });
};

// Dashboard.jsx
const loadData = async () => {
  const token = localStorage.getItem("authToken"); // ← Repeated
  const response = await fetch("http://localhost:5000/api/user/data", {
    headers: {
      Authorization: `Bearer ${token}`, // ← Repeated again
    },
  });
};

// Settings.jsx
const updateSettings = async (settings) => {
  const token = localStorage.getItem("authToken"); // ← Repeated
  await fetch("http://localhost:5000/api/user/settings", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`, // ← Repeated again!
    },
    body: JSON.stringify(settings),
  });
};
```

❌ **Problems:**

- Repeating the same token logic 50+ times in a large app
- If token storage changes (localStorage → sessionStorage → cookies), update 50+ places
- Error-prone: Easy to forget the Authorization header
- Hard to maintain and test

---

**After (With Axios + Interceptors):**

```javascript
// Login.jsx
import { loginWithEmail } from "../api/authService";
const response = await loginWithEmail(email, password); // ✅ Clean

// Dashboard.jsx
import apiClient from "../api/axiosConfig";
const response = await apiClient.get("/user/data"); // ✅ Token auto-added!

// Settings.jsx
const response = await apiClient.put("/user/settings", settings); // ✅ Token auto-added!
```

✅ **Benefits:**

- Token automatically attached to every request
- One source of truth (axiosConfig.js)
- Change token storage once → updates everywhere
- Cleaner, more readable component code

---

### How Request Interceptor Works

Think of it like a **customs agent at airport security**:

```
You: "I want to fly to the backend!"
     ↓
Customs Agent (Interceptor): "Let me check your credentials..."
     ↓
Agent checks: "Do you have a passport (token)?"
     ↓
If YES → "Add this to your boarding pass (Authorization header)"
If NO  → "OK, you can go as a visitor (public endpoint)"
     ↓
You board the plane → Backend receives your request
```

**Code Flow:**

```javascript
// Step 1: Component makes request
const response = await apiClient.get("/user/profile");

// Step 2: Interceptor intercepts BEFORE request is sent
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  // Step 3: Interceptor modifies the config
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Step 4: Modified config sent to backend
  return config;
});

// Step 5: Backend receives request with Authorization header
// Backend: "Oh, I see you have a valid token. Here's your data!"
```

---

### Request Interceptor Features

```
REQUEST FLOW:
═════════════════════════════════════════════════════════════════

Component Code
    ↓
    Calling: apiClient.get('/user/data')
    ↓
┌───────────────────────────────────────────────────────────────┐
│ REQUEST INTERCEPTOR RUNS                                      │
├───────────────────────────────────────────────────────────────┤
│ 1. Get token from localStorage                                │
│ 2. If token exists:                                           │
│    → Add to config.headers.Authorization = `Bearer ${token}`  │
│ 3. Log the request (for debugging)                            │
│ 4. Return modified config                                     │
└───────────────────────────────────────────────────────────────┘
    ↓
Axios sends HTTP request to backend with Authorization header
    ↓
Backend (.NET API) receives request:
{
  GET /api/user/data
  Headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..."
  }
}
    ↓
Backend validates token and returns user data
```

---

## 💻 The Code Files Created

### File 1: `src/api/axiosConfig.js`

**What it does:**

- Creates a configured Axios instance
- Sets base URL (points to your .NET backend)
- Adds Request Interceptor to attach token

**Key Points:**

```javascript
// 1. Base URL - Change this to your backend
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// 2. Create instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// 3. Request Interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 4. Export for use in other files
export default apiClient;
```

---

### File 2: `src/api/authService.js`

**What it does:**

- Contains all authentication API calls
- Uses the configured `apiClient` instance
- Provides clean functions to components

**Example Endpoints:**

```javascript
// Login
export const loginWithEmail = async (email, password) => {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });
  return response.data; // Returns { token, user, ... }
};

// Get current user (automatically includes token via interceptor)
export const getCurrentUser = async () => {
  const response = await apiClient.get("/auth/me");
  return response.data; // Returns { id, email, name, ... }
};

// Logout
export const logoutUser = async () => {
  await apiClient.post("/auth/logout", {});
};
```

---

## 🔧 Setup Instructions

### 1. Install Axios (if not already installed)

```bash
npm install axios
```

### 2. Create the API folder structure

```
frontend/src/
├── api/
│   ├── axiosConfig.js     ← Axios configuration
│   └── authService.js     ← Authentication endpoints
├── pages/
├── components/
└── context/
```

### 3. Update Your Environment Variables

Create `.env` file in frontend root:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Or for production:

```env
REACT_APP_API_URL=https://your-production-api.com/api
```

### 4. Import and Use in Components

```javascript
// Before (Old way)
const response = await fetch('http://localhost:5000/api/auth/login', {...});

// After (New way - Step 1)
import { loginWithEmail } from '../api/authService';
const response = await loginWithEmail(email, password);
```

---

## 📊 Comparison: Before vs After

| Aspect               | Before (Fetch)        | After (Axios + Interceptor) |
| -------------------- | --------------------- | --------------------------- |
| **Token management** | Manual on every call  | Automatic via interceptor   |
| **Lines of code**    | More verbose          | Clean and simple            |
| **Consistency**      | Easy to forget header | Always included             |
| **Maintainability**  | Change in 50+ places  | Change in 1 place           |
| **Error handling**   | Manual per request    | Centralized (Step 2)        |
| **Loading states**   | Manual                | Easy with async/await       |

---

## 🎯 What This Step Achieves

✅ **Centralized API Configuration**

- One place to manage API URL, timeouts, headers

✅ **Automatic Token Attachment**

- Every authenticated request includes the token automatically
- No manual `Authorization` header needed

✅ **Clean Component Code**

- Components are simpler and more readable
- Focus on business logic, not HTTP details

✅ **Easy to Extend**

- Add new endpoints to authService.js
- All get token attachment automatically

✅ **Maintainability**

- Change token format once → works everywhere
- Change API URL once → works everywhere

---

## 📝 Expected .NET Backend API

The code assumes your .NET backend has endpoints like:

```
POST /api/auth/login
Body: { email: "user@example.com", password: "password123" }
Response: {
  success: true,
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: {
    id: 1,
    email: "user@example.com",
    name: "John Doe"
  }
}

GET /api/auth/me (with Authorization: Bearer {token})
Response: {
  id: 1,
  email: "user@example.com",
  name: "John Doe",
  role: "user"
}

POST /api/auth/logout (with Authorization: Bearer {token})
Response: { success: true }
```

---

## 🧪 Quick Test

After setting up files, you can test in browser console:

```javascript
import { loginWithEmail } from "./src/api/authService";

// Try to login
const result = await loginWithEmail("test@example.com", "password");
console.log("Login response:", result);

// Token should be available to store
if (result.token) {
  localStorage.setItem("authToken", result.token);
}
```

---

## 🔑 Key Takeaways

1. **Request Interceptor** = Automatic token attachment
2. **One source of truth** = axiosConfig.js
3. **Clean services** = authService.js with reusable functions
4. **Scalable** = Easy to add new endpoints
5. **Maintainable** = Change logic in one place

---

## ✅ Step 1 Complete!

You now have:

- ✅ Centralized Axios configuration (`axiosConfig.js`)
- ✅ Request Interceptor that auto-attaches tokens
- ✅ Authentication service (`authService.js`)
- ✅ Clean function exports for components

**The foundation is set!**

In **Step 2**, we'll add the **Response Interceptor** that listens for 401 errors, clears localStorage, and redirects to login.

---

**Ready for Step 2? Say "next" and I'll guide you through the Response Interceptor! 🚀**
