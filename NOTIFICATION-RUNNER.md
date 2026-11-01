# YOG browser notification delivery

The owner-authorized Site MCP tool `process_due_notifications` delivers only already-approved campaigns whose scheduled time has arrived. It must never create or approve campaigns. Call `notification_runner_status` afterward to verify the persisted last-run timestamp. A connected cloud runner should check every 15 minutes in Africa/Casablanca. Stay quiet after normal or empty runs; notify the owner only for a failure requiring action. No source changes or republishing are needed for routine sends.

Product saves create one campaign for publication, a lower effective selling price, or restored product stock. Enabled automatic switches approve these campaigns; disabled switches create drafts. Admins may separately preview, send or schedule drafts. The background request immediately attempts up to 10 deliveries; the cloud runner processes up to 40 per invocation. Remaining deliveries and bounded retries wait for another run. Scheduled delivery is therefore approximate and may be delayed by backlog or push services.

Recipients explicitly opt in through their browser and choose categories. Restock alerts target watched product IDs when any option returns. Each browser has a hashed management token. Unsubscribed or disabled recipients are skipped and expired endpoints disabled. Only approved browser-push HTTPS hosts are accepted, and redirects are rejected. Secrets are hosted runtime variables, never committed here.

Delivery reports distinguish service acceptance from actual device display. Push providers may defer or discard messages. iPhone/iPad visitors need to install the store on their Home Screen and grant notification permission. No email alerts are sent.

Local verification: `node scripts/prepare-push-preview.mjs` creates separate ignored local keys and generates application icons. `node scripts/push-smoke.mjs` requires the local preview on port 5173 with an isolated database and zero real subscribers. Its synthetic endpoint is removed before campaigns run, so no real push service receives test notifications.
