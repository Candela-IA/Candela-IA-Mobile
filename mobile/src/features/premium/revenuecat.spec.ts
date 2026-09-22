/**
 * Qué clave de RevenueCat le toca a cada tienda.
 *
 * Es una decisión de una línea que no se ve fallar: con la clave cambiada el
 * SDK arranca igual y el paywall solo se rompe cuando alguien intenta pagar,
 * que es el peor momento para enterarse. Y con Android ya cobrando, el día
 * que se añada la de Apple hay que poder tocarla sin llevarse por delante la
 * que funciona.
 */

import { AppConfig } from '../../config/app_config';
import { claveDeTienda } from './revenuecat';

describe('clave de RevenueCat por plataforma', () => {
  it('Android usa la clave del proyecto de Google', () => {
    expect(claveDeTienda('android')).toBe(AppConfig.revenueCat.android);
    expect(claveDeTienda('android')).toMatch(/^goog_/);
  });

  it('iOS nunca usa la de Android', () => {
    // El accidente que esta prueba existe para impedir: "arreglar" iOS
    // apuntándolo a la clave que ya funciona lanzaría la compra contra el
    // proyecto de Google desde un iPhone.
    expect(claveDeTienda('ios')).not.toBe(AppConfig.revenueCat.android);
  });

  it('iOS se queda sin tienda hasta que haya una clave appl_', () => {
    // Pasa hoy (null, no hay cuenta de Apple) y sigue pasando el día que se
    // rellene, siempre que sea la clave que corresponde.
    const clave = claveDeTienda('ios');
    expect(clave === null || clave.startsWith('appl_')).toBe(true);
  });

  it('web y lo que venga después tampoco tienen tienda', () => {
    expect(claveDeTienda('web')).toBeNull();
    expect(claveDeTienda('macos')).toBeNull();
  });
});
