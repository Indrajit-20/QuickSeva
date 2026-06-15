# TODO (QuickSeva bug-fix)

- [ ] Update `frontend/src/App.jsx`:
  - [ ] Implement role check in `SellerProtectedRoute` using `useAuth()`.
  - [ ] Update `AppRoutes` to use live `user?.role` from `useAuth()` instead of `localStorage`.
- [ ] Update `frontend/src/pages/OtpVerification.jsx`:
  - [ ] In `handleSubmit`, after successful OTP verification, remove writes to `localStorage` for `user` and `userRole`; keep only `authToken`.
- [ ] Run frontend tests/build/lint (if available) to ensure no syntax errors.
