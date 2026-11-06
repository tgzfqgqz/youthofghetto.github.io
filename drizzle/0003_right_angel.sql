CREATE TABLE `push_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`product_id` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`url` text NOT NULL,
	`state` text NOT NULL,
	`due` integer NOT NULL,
	`created` integer NOT NULL,
	`snapshot_at` integer
);
--> statement-breakpoint
CREATE INDEX `push_campaign_due` ON `push_campaigns` (`state`,`due`);--> statement-breakpoint
CREATE TABLE `push_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`subscriber_id` text NOT NULL,
	`state` text NOT NULL,
	`attempts` integer NOT NULL,
	`next_try` integer NOT NULL,
	`http_status` integer
);
--> statement-breakpoint
CREATE INDEX `push_delivery_campaign` ON `push_deliveries` (`campaign_id`,`state`);--> statement-breakpoint
CREATE TABLE `push_locks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `push_subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`token_hash` text NOT NULL,
	`preferences` text NOT NULL,
	`watched` text NOT NULL,
	`active` integer NOT NULL,
	`created` integer NOT NULL
);
