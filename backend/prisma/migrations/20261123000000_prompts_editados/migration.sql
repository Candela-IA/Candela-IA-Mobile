-- Los prompts que el cliente reescribe desde "Entrenar a la IA" en Ajustes.
--
-- Una fila por tono editado; si no hay fila, manda el texto de
-- `catalogo.ts`. "Restaurar original" borra la fila. Ninguna tabla existente
-- se toca, así que esta migración no puede romper nada de lo que ya hay.
CREATE TABLE `tone_overrides` (
    `id` VARCHAR(191) NOT NULL,
    `feature` ENUM('ANALIZAR_CHAT', 'ANALIZAR_STORIES', 'ROMPEHIELOS', 'CREAR_NOTAS') NOT NULL,
    `tone` VARCHAR(40) NOT NULL,
    `instruction` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tone_overrides_feature_tone_key`(`feature`, `tone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

