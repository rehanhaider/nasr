CREATE TABLE IF NOT EXISTS `settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `deen_days` (
  `date` text PRIMARY KEY NOT NULL,
  `fajr` text,
  `dhuhr` text,
  `asr` text,
  `maghrib` text,
  `isha` text,
  `morning_adhkar` integer DEFAULT false,
  `evening_adhkar` integer DEFAULT false,
  `night_ayat` integer DEFAULT false,
  `ruqyah` integer DEFAULT false,
  `istighfar_count` integer DEFAULT 0,
  `note` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sadaqah_log` (
  `id` text PRIMARY KEY NOT NULL,
  `date` text NOT NULL,
  `note` text,
  `amount` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `observations` (
  `id` text PRIMARY KEY NOT NULL,
  `timestamp` text NOT NULL,
  `text` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sessions` (
  `token_hash` text PRIMARY KEY NOT NULL,
  `created_at` text NOT NULL,
  `last_seen_at` text NOT NULL,
  `revoked` integer DEFAULT false
);
--> statement-breakpoint
-- Seed default settings
INSERT OR IGNORE INTO `settings` (`key`, `value`) VALUES ('timezone', 'Asia/Kolkata');
--> statement-breakpoint
INSERT OR IGNORE INTO `settings` (`key`, `value`) VALUES ('istighfar_target', '100');
