CREATE TABLE `catProfiles` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`name` varchar(100) NOT NULL,
	`breed` varchar(100),
	`age` int,
	`weight` decimal(5,2),
	`color` varchar(50),
	`avatarUrl` varchar(500),
	`personalityTags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `catProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `humanToCatTranslations` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`inputText` varchar(500) NOT NULL,
	`detectedLanguage` varchar(10),
	`mappedIntent` varchar(100),
	`outputAudioUrl` varchar(500),
	`outputEmotion` enum('hungry','angry','scared','happy','playful','inPain','mating','territorial','greeting','demand'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `humanToCatTranslations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainingSamples` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`translationId` bigint unsigned NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`isAccurate` boolean NOT NULL,
	`correctedEmotion` varchar(50),
	`notes` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trainingSamples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`catProfileId` bigint unsigned,
	`audioUrl` varchar(500),
	`primaryEmotion` enum('hungry','angry','scared','happy','playful','inPain','mating','territorial','greeting','demand') NOT NULL,
	`intensity` enum('low','medium','high') NOT NULL,
	`urgency` enum('casual','moderate','urgent') NOT NULL,
	`context` enum('foodRelated','attentionSeeking','threatResponse','social','physicalState'),
	`confidenceScore` decimal(5,2),
	`secondarySignals` json,
	`suggestedAction` varchar(500),
	`durationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `translations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`defaultCatProfileId` bigint unsigned,
	`audioSensitivity` int NOT NULL DEFAULT 50,
	`languagePreference` varchar(10) DEFAULT 'en',
	`privacyMode` boolean NOT NULL DEFAULT true,
	`notificationsEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`unionId` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`avatar` text,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignInAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_unionId_unique` UNIQUE(`unionId`)
);
--> statement-breakpoint
ALTER TABLE `catProfiles` ADD CONSTRAINT `catProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `humanToCatTranslations` ADD CONSTRAINT `humanToCatTranslations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainingSamples` ADD CONSTRAINT `trainingSamples_translationId_translations_id_fk` FOREIGN KEY (`translationId`) REFERENCES `translations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainingSamples` ADD CONSTRAINT `trainingSamples_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `translations` ADD CONSTRAINT `translations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `translations` ADD CONSTRAINT `translations_catProfileId_catProfiles_id_fk` FOREIGN KEY (`catProfileId`) REFERENCES `catProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userSettings` ADD CONSTRAINT `userSettings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userSettings` ADD CONSTRAINT `userSettings_defaultCatProfileId_catProfiles_id_fk` FOREIGN KEY (`defaultCatProfileId`) REFERENCES `catProfiles`(`id`) ON DELETE no action ON UPDATE no action;