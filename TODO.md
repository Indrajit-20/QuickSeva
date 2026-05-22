# TODO - QuickSeva Urban-style Services redesign

## Step 1: Home page updates

- [ ] Remove `HomeBookingFlow` import + component usage from `frontend/src/pages/Home.jsx`
- [x] Delete `frontend/src/components/HomeBookingFlow.jsx`

- [x] Add `UrbanServiceCategories` import + render it right after `<Hero />` in `frontend/src/pages/Home.jsx`

## Step 2: Shared data

- [ ] Ensure `frontend/src/data/servicesData.js` exists and exports `categoriesData`
- [x] Move the category/service data currently embedded in `frontend/src/components/UrbanServiceCategories.jsx` into `frontend/src/data/servicesData.js`
      +- [x] Ensure `frontend/src/data/servicesData.js` exists and exports `categoriesData`

## Step 3: UrbanServiceCategories UI + navigation

- [x] Redesign `frontend/src/components/UrbanServiceCategories.jsx` to match Urban Company style requirements (light bg, horizontal scroll rows, cards, see-all link, right arrow)
- [x] Update card + “See all” click navigation to `/services?category=<cat.title>`

## Step 4: ServicesPage filtering by category

- [x] Update `frontend/src/pages/ServicesPage.jsx` to read `?category=` via `useSearchParams`

- [x] Filter and render services when `category` exists
- [x] When no category param: show all categories grouped with headings
- [x] Update filter chips to use titles from `categoriesData`
- [x] Ensure each service “Book Now” navigates to `/book/:sellerId`

## Step 5: Verification

- [ ] Run `npm run build` or `npm run dev` in `frontend/`
- [ ] Manually test navigation and UI
