# TODO - Paid Lead Generation (Seller Phone + Booking)

## Planned implementation steps

- [x] Backend: Add migration to create `lead_charges` table with unique (buyer_id, seller_id, service_id)

- [x] Backend: Create `LeadChargeModel` for inserting/fetching lead charges

- [x] Backend: Create reusable `chargeSellerForLead(sellerId, buyerId, serviceId, source)` service

- [x] Backend: Add protected endpoint `POST /api/leads/charge`

- [x] Backend: Register new route in `backend/server.js`

- [x] Frontend: Update `SellerPublicProfile.jsx`
  - [ ] Hide phone by default
  - [ ] Add View Contact button
  - [ ] Add modal confirmation (Interested in this service?)
  - [ ] On confirm, call `/api/leads/charge` with source `contact_view`
  - [ ] Reveal phone after successful response

- [ ] Frontend: Update `BookingPage.jsx`
  - [ ] Add booking confirmation modal (Confirm Service Booking)
  - [ ] On confirm, call `/api/leads/charge` with source `booking`
  - [ ] Continue booking regardless of `charged` flag
  - [ ] Stop booking if cancelled
- [ ] Test flow manually:
  - [ ] View Contact charges ₹1 once and phone reveals
  - [ ] Booking after View Contact does not charge again
  - [ ] Booking without View Contact charges once
