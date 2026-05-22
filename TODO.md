# TODO - QuickSeva bulk implementation

## Step 1: Update shared data

- [ ] Edit `frontend/src/data/servicesData.js`
  - Add/export: `ALL_SERVICE_SUGGESTIONS`, `CATEGORIES`, `serviceToCategory`, `categoryToKeywords`
  - Keep existing `categoriesData` unchanged

## Step 2: Redesign Hero

- [ ] Edit `frontend/src/components/Hero.jsx`
  - Keep icon grid behavior (navigate to `/services?category=...`)
  - Add Bark-like search bar under grid
  - Add debounced Nominatim location dropdown + outside-click close
  - Add popular quick tags

## Step 3: Clean Home page

- [ ] Edit `frontend/src/pages/Home.jsx`
  - Remove imports/usages of `UrbanServiceCategories` and `HomeBookingFlow` if present
  - Ensure Home still renders Hero + NearbyServices + Why Choose + CTA + Footer

## Step 4: Full ServicesPage redesign

- [ ] Edit `frontend/src/pages/ServicesPage.jsx`
  - Parse URL params: `category, q, location, lat, lon, showMap`
  - Implement `selectedService` flow (service cards -> seller panel)
  - Chips based on `CATEGORIES`
  - Seller filtering based on `categoryToKeywords`
  - Seller action buttons navigate to `/seller/:id`
  - Map section passes new props to NearbyServices
  - Auto-scroll to map when `showMap === "true"`

## Step 5: NearbyServices prop support + button fix

- [ ] Edit `frontend/src/components/NearbyServices.jsx`
  - Accept `centerLat`, `centerLon`, `locationFilter`
  - If center coords provided, center/fly map there
  - Change action CTA to “View Details →” and navigate to `/seller/:id`

## Step 6: Full SellerPublicProfile redesign

- [ ] Edit `frontend/src/pages/SellerPublicProfile.jsx`
  - Remove booking form completely
  - Implement 2-column layout
  - Add Call/WhatsApp/Get Free Quote modal
  - Implement Services & Pricing cards from category matching using `categoryToKeywords`
  - WhatsApp enquire message includes selected service price

## Step 7: Verification

- [ ] Run `npm test` / `npm run build` (as applicable) or `npm run dev` + basic navigation checks:
  - Home icon click -> `/services?category=...`
  - Hero search -> services list + map centered + auto-scroll
  - Service card -> seller panel
  - View Details -> `/seller/:id`
  - Seller page contact UI renders
