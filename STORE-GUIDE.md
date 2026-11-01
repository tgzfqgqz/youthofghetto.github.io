# YOG store / TheMask

This folder is the live-store application. The original single-file website remains at `../index.html`.

## Admin

First visit `/admin/activate`, verify the owner's ChatGPT account, and choose your owner username and password. Then use `/admin` for username/password sign-in. The owner can create, disable, re-enable, and reset other admin accounts in Admin accounts. Password reset and account disabling revoke active password sessions. Owner recovery remains protected by the hosted ADMIN_EMAIL account.

Products: add a title, description, MAD price, optional sale price, category, photos, and size/color stock rows. The first image is the cover. Save a product as Draft to hide it, Active to offer available variants, or Sold out to keep it visible without accepting purchases. Images are stored in R2; product data and orders are stored in D1.

Store settings: edit the announcement, turn it on/off, set the delivery fee, update the comma-separated list of cities, set WhatsApp, and enable/disable cash on delivery. Initial delivery settings are 35 MAD and Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir, Meknès and Oujda. These are editable starting settings, not verified shipping terms. Review before accepting orders.

Discounts: create percentage codes, disable them, or set an expiry date (UTC). Discounts apply to product totals before delivery. No usage limits are implemented.

Orders: review the latest 250 orders, including customer delivery details. New → Confirmed → Shipped → Delivered. Cancel New or Confirmed orders to restore stock. Delivered revenue reflects those latest 250 orders and is not payment reconciliation. WhatsApp is opened only by the customer; it does not send messages automatically.

## Launch status

The store starts with an empty catalogue. Old demonstration prices were in USD, so they were not silently converted to MAD or published as sellable stock. Add real products and inventory in the admin panel.

Online card payments are not integrated. Choose a payment provider that supports your Moroccan merchant business, then connect its official server-side payment flow and verify signed payment webhooks before enabling it. Do not collect card details in this app or paste merchant secrets into source files.

The storefront is public and has no admin navigation links. Admin pages are excluded from search indexing; every administrative operation requires authorization. Hiding a URL is not a security boundary.

## Drop labels and account protection

New products default to the New arrival label. Turn it off in the product editor when appropriate. Exclusive is an independent checkbox for special releases. Both labels can appear together on product cards and details.

Admin passwords require 14–128 characters and are salted and hashed with native Web Crypto PBKDF2-SHA256 at the runtime-supported 100,000 iterations. Sessions use random tokens, store only token hashes, expire after 24 hours, and use HttpOnly, SameSite=Strict cookies with Secure on HTTPS. Login attempts are limited by username and client IP. There is no public account registration. Runtime references: [Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/) and [Workers PBKDF2 limit](https://github.com/cloudflare/workerd/issues/1346).

Run `node scripts/admin-auth-smoke.mjs` against the local preview to test authentication, permissions, revocation, rate limits and product labels. Tests generate local-only passwords without printing them.

## Development and checks

## Statistics

Open Statistics in the admin sidebar. The panel refreshes every 30 seconds while visible and offers rolling 24-hour, 7-day, 30-day and 90-day ranges. Daily chart labels are UTC. Active now means a measured browser sent a visible-page heartbeat during the preceding two minutes. Distinct browsers are estimates, not identified people; multiple devices and cleared browser storage can count separately. Returning means a browser has an earlier visit in the retained data.

The interactive globe has drag rotation, zoom, reset and keyboard-operable buttons. City/country counts and location selection also work without interacting with the canvas. Locations come only from trusted request metadata captured by the Worker, with coordinates rounded to one decimal degree. Missing locations are Unknown and are not assigned a guessed map position. Local preview deliberately has no location metadata. The globe maps up to 250 location groups; list panels show the top 20 for the selected view. People moving between locations may appear in multiple location groups.

Visitors explicitly opt in to analytics. DNT/GPC, detected bots and signed-in administrators are excluded. No GPS permissions are requested and this app does not persist raw IP addresses or full referrer URLs. Stored information includes hashed random browser/session IDs, timestamps, approximate location, estimated device class, referring domain and product interactions. Browser IDs expire after 90 days; visit sessions renew after 30 minutes of inactivity. Analytics records older than 90 days are removed on subsequent tracking requests; dashboard ranges never expose older records. Browser privacy preferences can be changed from the storefront footer.

Sales figures use saved orders independently of analytics opt-in. Delivered revenue is the recorded total of delivered orders, not payment-provider settlement. Product sales exclude cancelled orders. Order value includes delivery and excludes cancellations. Conversion counts distinct measured sessions attached to non-cancelled orders, so it can differ from the all-orders total. Current low-stock alerts show up to 20 active product options with 0–5 units, regardless of the selected period.

Map outlines are [Natural Earth public-domain data](https://www.naturalearthdata.com/about/terms-of-use/), downloaded from the [Natural Earth source repository](https://github.com/nvkelso/natural-earth-vector). Approximate location metadata follows the [Cloudflare Request API](https://developers.cloudflare.com/workers/runtime-apis/request/). No external map service is needed to display the globe.

`node scripts/statistics-smoke.mjs` tests private analytics access, exclusions, deduplication, sessions, returning visitors, source minimization, geography validation, conversion, best sellers and low stock against the local preview only. Synthetic local test visits are not deployed.

Use Node 22.13+ and the Sites skill's dependency installation/build workflow. Local preview uses `.dev.vars` with `ADMIN_EMAIL="seedy@sites.test"` and the starter's local-only sign-in mock. Never put that test address into production configuration.

Generate migrations using `npm run db:generate`; deploy through Sites. The initial migration is `drizzle/0000_quiet_mandroid.sql`. Do not replay it on an existing database.

`node scripts/local-smoke.mjs` runs against the local preview at port 5173. It tests authorization, cross-origin protection, photo uploads, visibility, discounts, order idempotency, concurrency and stock restoration. Test data stays in the local database as hidden products and cancelled orders and is not included in deployments.

Type check: `node node_modules/typescript/bin/tsc --noEmit`.

Known scope: no email/SMS notifications, returns workflow, courier integration, card payments, advanced tax accounting or fraud controls. Admin stock edits set absolute stock; refresh before making inventory changes during active sales.
