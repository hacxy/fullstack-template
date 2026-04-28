ALTER TABLE `User` ADD `email` text NOT NULL;--> statement-breakpoint
ALTER TABLE `User` ADD `passwordHash` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);