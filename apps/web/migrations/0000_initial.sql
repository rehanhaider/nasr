CREATE TABLE IF NOT EXISTS `settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text
);

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

CREATE TABLE IF NOT EXISTS `sadaqah_log` (
  `id` text PRIMARY KEY NOT NULL,
  `date` text NOT NULL,
  `note` text,
  `amount` integer
);

CREATE TABLE IF NOT EXISTS `observations` (
  `id` text PRIMARY KEY NOT NULL,
  `timestamp` text NOT NULL,
  `text` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `opportunities` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `organisation` text,
  `contact_name` text,
  `contact_channel` text,
  `type` text NOT NULL,
  `source` text,
  `stage` text NOT NULL,
  `status` text NOT NULL DEFAULT 'open',
  `opened_date` text NOT NULL,
  `closed_date` text,
  `stage_at_close` text,
  `next_action` text,
  `next_action_date` text,
  `notes` text
);

CREATE TABLE IF NOT EXISTS `touches` (
  `id` text PRIMARY KEY NOT NULL,
  `opportunity_id` text NOT NULL REFERENCES `opportunities`(`id`) ON DELETE CASCADE,
  `date` text NOT NULL,
  `direction` text NOT NULL,
  `channel` text NOT NULL,
  `written` integer DEFAULT false,
  `note` text
);

CREATE TABLE IF NOT EXISTS `sessions` (
  `token_hash` text PRIMARY KEY NOT NULL,
  `created_at` text NOT NULL,
  `last_seen_at` text NOT NULL,
  `revoked` integer DEFAULT false
);

-- Seed default settings
INSERT OR IGNORE INTO `settings` (`key`, `value`) VALUES ('timezone', 'Asia/Kolkata');
INSERT OR IGNORE INTO `settings` (`key`, `value`) VALUES ('istighfar_target', '100');
INSERT OR IGNORE INTO `settings` (`key`, `value`) VALUES ('live_target', '10');
