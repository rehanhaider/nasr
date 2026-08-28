ALTER TABLE `deen_days` ADD `night_ayat_kursi` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `deen_days` ADD `night_baqarah` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `deen_days` ADD `night_three_suras` integer DEFAULT false;
--> statement-breakpoint
UPDATE `deen_days`
SET `night_ayat_kursi` = COALESCE(`night_ayat`, false),
    `night_baqarah` = COALESCE(`night_ayat`, false),
    `night_three_suras` = COALESCE(`night_ayat`, false);
--> statement-breakpoint
CREATE TABLE `deen_content` (
  `id` text PRIMARY KEY NOT NULL,
  `item_key` text NOT NULL,
  `title` text NOT NULL,
  `arabic` text,
  `transliteration` text,
  `meaning` text,
  `repetitions` text NOT NULL,
  `reference` text NOT NULL,
  `grade` text NOT NULL,
  `sort_order` integer NOT NULL,
  `note` text
);
