-- Los intentos gratis pasan de 5 de por vida a 6 que se renuevan cada semana.
--
-- La columna es NULL-able a propósito: las filas que ya existen no tienen
-- fecha de renovación, y rellenarlas aquí con una fecha fija dejaría a todo
-- el mundo renovando el mismo día. Al leerlas, el backend les asigna su
-- propia ventana de 7 días, así que cada usuario estrena sus intentos la
-- primera vez que abre la app después del cambio.
ALTER TABLE `credit_balances` ADD COLUMN `freeResetAt` DATETIME(3) NULL;
