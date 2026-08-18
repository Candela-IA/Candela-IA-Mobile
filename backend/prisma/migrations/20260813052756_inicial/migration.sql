-- CreateTable
CREATE TABLE `devices` (
    `id` VARCHAR(191) NOT NULL,
    `deviceKey` VARCHAR(128) NOT NULL,
    `platform` ENUM('ANDROID', 'IOS') NOT NULL,
    `appVersion` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `devices_deviceKey_key`(`deviceKey`),
    INDEX `devices_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_balances` (
    `id` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `freeUsed` INTEGER NOT NULL DEFAULT 0,
    `dailyUsed` INTEGER NOT NULL DEFAULT 0,
    `dailyResetAt` DATETIME(3) NOT NULL,
    `lifetimeUsed` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `credit_balances_deviceId_key`(`deviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `rcUserId` VARCHAR(128) NULL,
    `status` ENUM('NONE', 'TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'BILLING_ISSUE') NOT NULL DEFAULT 'NONE',
    `plan` ENUM('WEEKLY', 'ANNUAL') NULL,
    `expiresAt` DATETIME(3) NULL,
    `lastEventAt` DATETIME(3) NULL,
    `lastEventId` VARCHAR(128) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscriptions_deviceId_key`(`deviceId`),
    UNIQUE INDEX `subscriptions_rcUserId_key`(`rcUserId`),
    INDEX `subscriptions_status_expiresAt_idx`(`status`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `generations` (
    `id` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `feature` ENUM('ANALIZAR_CHAT', 'ANALIZAR_STORIES', 'ROMPEHIELOS', 'CREAR_NOTAS') NOT NULL,
    `tone` VARCHAR(40) NOT NULL,
    `isRegeneration` BOOLEAN NOT NULL DEFAULT false,
    `tokensIn` INTEGER NOT NULL,
    `tokensOut` INTEGER NOT NULL,
    `costUsd` DECIMAL(10, 8) NOT NULL,
    `latencyMs` INTEGER NOT NULL,
    `rating` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `generations_deviceId_createdAt_idx`(`deviceId`, `createdAt`),
    INDEX `generations_feature_createdAt_idx`(`feature`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `credit_balances` ADD CONSTRAINT `credit_balances_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `generations` ADD CONSTRAINT `generations_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
