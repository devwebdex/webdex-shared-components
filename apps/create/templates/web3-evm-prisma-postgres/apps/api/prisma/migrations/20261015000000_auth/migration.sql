-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "auth_nonces" (
    "nonce" CHAR(32) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_nonces_pkey" PRIMARY KEY ("nonce")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" CHAR(64) NOT NULL,
    "address" CHAR(42) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);
