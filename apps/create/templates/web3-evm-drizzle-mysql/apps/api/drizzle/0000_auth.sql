CREATE TABLE `auth_nonces` (
	`nonce` char(32) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	CONSTRAINT `auth_nonces_nonce` PRIMARY KEY(`nonce`)
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` char(64) NOT NULL,
	`address` char(42) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `auth_sessions_id` PRIMARY KEY(`id`)
);
