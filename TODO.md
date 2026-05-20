# TODO

- [ ] Add missing route for admin login in `frontend/src/App.jsx`
  - Import `AdminLogin` from `./pages/AdminLogin`
  - Add `<Route path="/admin/login" element={<AdminLogin />} />`
- [ ] Re-run frontend and verify `http://localhost:5173/admin/login` loads the admin login form
- [ ] Verify admin login redirect to `/admin/dashboard`
