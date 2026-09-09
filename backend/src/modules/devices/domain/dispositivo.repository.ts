/**
 * PUERTO de persistencia del agregado Dispositivo.
 *
 * El dominio declara qué operaciones necesita; la infraestructura decide si
 * eso es MySQL, Postgres o memoria. Los casos de uso dependen de esta
 * interfaz, nunca de Prisma.
 */

import { Funcion } from '../../generation/domain/catalogo';
import { Dispositivo, Plataforma } from './dispositivo.aggregate';

export const DISPOSITIVO_REPO = Symbol('DISPOSITIVO_REPO');

export interface DatosRegistro {
  readonly deviceKey: string;
  readonly plataforma: Plataforma;
  readonly appVersion?: string;
}

export interface DispositivoRepository {
  /**
   * Devuelve el dispositivo si ya existía, o lo crea con las bolsas llenas.
   *
   * Es idempotente a propósito: la app llama a esto en cada arranque y no
   * debería duplicar nada ni reiniciar contadores. Aquí es donde el usuario
   * que reinstala recupera su saldo en vez de estrenar intentos nuevos.
   */
  registrarORecuperar(datos: DatosRegistro): Promise<Dispositivo>;

  buscarPorId(id: string): Promise<Dispositivo | null>;

  /**
   * Consume un crédito de forma atómica.
   *
   * Se hace en el repositorio y no en el caso de uso porque necesita una
   * transacción con bloqueo de fila: si el usuario toca "Generar" dos veces
   * seguidas, dos peticiones simultáneas podrían leer el mismo saldo y
   * gastar un solo crédito por dos generaciones.
   *
   * Devuelve el agregado ya actualizado.
   */
  consumirCredito(
    id: string,
    funcion: Funcion,
    ahora: Date,
  ): Promise<Dispositivo>;

  /** Devuelve el crédito a la bolsa de esa función cuando la IA falló. */
  devolverCredito(id: string, funcion: Funcion, ahora: Date): Promise<void>;
}
