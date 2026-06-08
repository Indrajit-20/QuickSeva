# TODO - Fix mobile swipe/scroll on icon strip

## Step 1: Inspect current implementation

- [x] Read `frontend/src/components/Hero.jsx` to find the icon strip markup and classes.

## Step 2: Update CSS behavior for mobile scrolling

- [x] Ensure icon strip container allows horizontal momentum scroll and swipe:
  - [x] Add `style` for `WebkitOverflowScrolling: 'touch'` and `touchAction: 'pan-x'`
  - [x] Make sure container has `flex-nowrap` and `overflow-x-auto` on mobile.

## Step 3: Prevent icon items from shrinking

- [x] Confirm icon button uses `flex-shrink-0` (or equivalent) for the icon+label.

## Step 4: Ensure no ancestor clips scrolling

- [x] Verify outer wrappers don’t use `overflow-hidden` on the mobile scroll path.
  - [x] Likely fix: removed `overflow-hidden` from the strip’s outer wrapper that could clip touch scroll.

## Step 5: Test

- [ ] Run frontend build/dev and verify on mobile widths (<640px): swipe left/right works.
- [ ] Verify desktop behavior (≥640px) still shows arrows and all icons fit.
