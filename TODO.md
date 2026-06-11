# TODO - QuickSeva Seller/User Authentication Fix

## Step 1: Identify root cause

- [x] Analyze backend OTP endpoints (sendOTP/verifyOTP) and frontend OTP flow.
- [x] Confirm which DB fields are used for phone normalization in each path.

## Step 2: Implement required architecture

- [x] Ensure login OTP searches ONLY `users` table.
- [x] Ensure OTP send/verify accept both seller and user roles (role stored in users).
- [x] Ensure seller registration creates `users` row with role='seller' and also creates `sellers` row with user_id immediately.

## Step 3: Fix seller OTP not finding seller accounts

- [x] Add seller profile creation inside `verifyOTP()` for `type === "seller-register"` immediately after `UserModel.create(...)`.
- [x] Add required console logs.
- [ ] Run verification SQL checks (manual):
  - [ ] SELECT \* FROM users WHERE role='seller';
  - [ ] SELECT \* FROM sellers;

## Step 4: Frontend redirect logic

- [ ] Ensure after OTP verify, frontend redirects based on returned user.role.

## Step 5: Add tests / run verification

- [ ] Manual test: Seller Register → OTP Verify → seller dashboard works.
- [ ] Manual test: Buyer Register/Login flow unchanged.
