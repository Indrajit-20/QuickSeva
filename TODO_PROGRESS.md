## TODO_PROGRESS

- [x] Inspect existing SellerRegister.jsx and backend sellerController registerSeller implementation
- [x] Update SellerRegister.jsx: remove category fetching, category state, category checkboxes, and category validation/payload
- [x] Update backend/controllers/sellerController.js:
  - [x] Make categoryIds optional during seller registration
  - [x] Skip seller_categories insertion when categoryIds is missing/empty
- [ ] Verify end-to-end:
  - [ ] Seller registration UI calls POST /sellers/register without categoryIds
  - [ ] POST /api/sellers/register succeeds when categoryIds is omitted
  - [ ] No GET /categories calls from SellerRegister
- [x] Implemented frontend + backend category removal/optional handling
