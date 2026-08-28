DROP TABLE IF EXISTS `touches`;
--> statement-breakpoint
DROP TABLE IF EXISTS `opportunities`;
--> statement-breakpoint
DELETE FROM `settings` WHERE `key` IN ('pipeline_start_date', 'live_target');
