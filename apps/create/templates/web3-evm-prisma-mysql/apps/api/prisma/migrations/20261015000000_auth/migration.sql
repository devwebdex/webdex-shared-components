-- CreateTable
CREATE TABLE `auth_nonces` (
    `nonce` CHAR(32) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`nonce`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_sessions` (
    `id` CHAR(64) NOT NULL,
    `address` CHAR(42) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
