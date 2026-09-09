-- Los intentos gratis dejan de ser una bolsa compartida y pasan a ser una por
-- función: 6 en cada una, con la misma renovación semanal.
--
-- Las cuatro columnas arrancan en 0 y NO se rellenan con el valor de
-- `freeUsed`. Sembrarlas con la bolsa vieja le pondría a cada función los
-- créditos que la persona gastó en total, y quien hubiera agotado los 6
-- compartidos se quedaría con las cuatro bolsas vacías el mismo día que el
-- cambio pretendía darle más. Empezando en 0, todo el mundo estrena.
--
-- `freeUsed` se queda donde está, escrita con la suma de las cuatro: no se
-- pierde el histórico y volver atrás es revertir el código, sin otra
-- migración de por medio.
ALTER TABLE `credit_balances`
  ADD COLUMN `freeUsedChat` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `freeUsedStories` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `freeUsedRompehielos` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `freeUsedNotas` INTEGER NOT NULL DEFAULT 0;
