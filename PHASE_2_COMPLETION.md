# Phase 2 Completion - Item Listings

Completed: 2026-09-14

## Implemented

- `/sell` provides an authenticated listing-creation form.
- Sellers can add a title, description, starting price, optional reserve price, auction start/end times, and up to five lot images.
- Images upload to the public `item-images` Supabase Storage bucket in the uploader's own folder.
- JPEG, PNG, and WebP images up to 15 MB each are accepted.
- Listing submission creates a pending `items` row and a linked scheduled `auctions` row.
- Database policies permit sellers to create auctions only for their own items.
- `/admin/items` allows an administrator to approve or reject pending listings.
- `/auctions` is a public catalogue of approved scheduled and active auction lots.
- `/auctions/[id]` displays a lot's image, description, current price, auction status, and scheduled end time.

## Manual Verification

- A test account was promoted to the `admin` role and the dashboard displayed `admin dashboard`.
- A listing was created and submitted for approval without an error.
- The public catalogue displayed auction lots with their current prices, scheduled end times, descriptions, and uploaded images.
- The signed-in user remained authenticated after dashboard refreshes and navigation between the dashboard, catalogue, and seller workspace.

## Security and Data Changes

- Migration `202609130003` created the `item-images` bucket and owner-scoped Storage policies.
- Migration `202609130004` added the seller-owned auction insert policy and raised the Storage image limit to 15 MB.
- Row Level Security remains enabled on the application tables and Storage objects.

## Automated Verification

- Migrations `202609130003` and `202609130004` were applied to the linked Supabase project.
- `npm run build` passed after the listing, catalogue, approval, image-upload, and authentication updates.

## Ready for Phase 3

The project is ready to implement the bidding engine: auction activation, database-level bid validation with row locking, current-price updates, and live bid broadcasts.