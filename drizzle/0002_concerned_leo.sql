CREATE TABLE `visit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`kind` text NOT NULL,
	`product_id` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_created` ON `visit_events` (`created`);--> statement-breakpoint
CREATE INDEX `events_session` ON `visit_events` (`session_id`);--> statement-breakpoint
CREATE TABLE `visit_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`started` integer NOT NULL,
	`last_seen` integer NOT NULL,
	`country` text NOT NULL,
	`city` text NOT NULL,
	`lat` real,
	`lon` real,
	`device` text NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visits_started` ON `visit_sessions` (`started`);--> statement-breakpoint
CREATE INDEX `visits_last_seen` ON `visit_sessions` (`last_seen`);--> statement-breakpoint
CREATE INDEX `visits_visitor` ON `visit_sessions` (`visitor_id`);--> statement-breakpoint
ALTER TABLE `orders` ADD `analytics_session` text;