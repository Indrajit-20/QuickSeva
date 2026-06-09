# TODO - Unavailable dates calendar fixes

- [x] Update `frontend/src/pages/seller/SellerServices.jsx` to use dedicated `unavailableDates` state.

- [ ] Implement robust ymd <-> Date conversion without timezone shift.
- [ ] Fix `react-multi-date-picker` `multiple` + `range` `onChange` normalization.
- [ ] Implement per-date remove UI and handler (Remove button on each chip).
- [ ] Implement Clear All Dates button.
- [ ] Ensure selected dates render below calendar and update instantly.
- [ ] Ensure Live Service Preview shows unavailable dates from same state.
- [ ] Add temporary log: `console.log("Selected Dates:", unavailableDates);`
- [ ] Ensure submit persists `unavailableDates` into service.
- [ ] Run `npm run lint` and basic manual tests.
