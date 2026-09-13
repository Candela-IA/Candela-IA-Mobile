# Conectar el cobro de las suscripciones

> Qué falta, en qué orden, y —lo más importante— **qué hace Sebastián y qué
> tiene que hacer el cliente**. Esta última parte no es burocracia: es lo que
> protege a los dos.

---

## 1. Dónde está la frontera

Con las estrellas de "Tu opinión" todo era código. Aquí no: hay dinero real
de por medio, y eso reparte el trabajo en tres capas.

| Capa | Quién | Por qué |
|---|---|---|
| **Código**: la app pide la compra, la procesa, el backend concede premium | Sebastián | Es desarrollo |
| **Productos**: crear las suscripciones con sus IDs y precios | Cualquiera de los dos, con acceso al panel | Es configuración |
| **Cuentas, datos fiscales y bancarios** | **Solo el cliente** | Ahí entra el dinero |

**La regla que no se rompe: Sebastián nunca pone sus datos bancarios ni
fiscales en Play Console.**

No es una formalidad. Si la cuenta de pagos es suya:

- El dinero de las suscripciones **entra en su cuenta**, y tributa a su
  nombre aunque no sea suyo.
- Es él quien responde ante Google por reembolsos y reclamaciones.
- La app queda **atada a su cuenta**: si mañana la relación se acaba, el
  cliente no puede llevarse su propia app sin publicarla de cero y perder
  todas las instalaciones y reseñas.

Nada de eso se arregla después. Se decide al crear la cuenta.

---

## 2. Lo que solo puede hacer el cliente

Ninguno de estos pasos puede darlos Sebastián por él, y todos son
**bloqueantes**: sin ellos, no hay nada que programar contra qué.

1. **Cuenta de Google Play Console** — 25 USD de pago único, a nombre suyo o
   de su empresa.
2. **Perfil de pagos**: datos fiscales, cuenta bancaria y verificación de
   identidad. **Google tarda entre días y un par de semanas en validarlo.**
   Es el paso que más veces retrasa un lanzamiento, así que conviene
   empezarlo el primer día aunque el resto no esté listo.
3. **Cuenta de RevenueCat** (gratis hasta cierto volumen de ingresos).
4. **Aceptar el acuerdo de distribución** para desarrolladores.

Sebastián puede pedir que lo inviten como desarrollador a esa cuenta para
hacer la parte técnica. Invitar a alguien al panel **no** le da acceso al
dinero: son permisos distintos.

---

## 3. El orden real, con sus dependencias

No se puede saltar ninguno, y cada uno necesita el anterior:

```
1. Cuenta de Play Console + perfil de pagos verificado    ← el cliente (días)
2. Crear las suscripciones con sus IDs y precios          ← panel
3. Integrar RevenueCat en la app                          ← código
4. Subir la app a un canal de pruebas internas            ← build + panel
5. Probar la compra con testers de licencia               ← sin cobro real
6. Publicar                                               ← el cliente
```

**El paso 5 es el que sorprende a todo el mundo.** Una compra no se puede
probar en el APK que instalas a mano: Google Play Billing solo responde si la
app viene de Play, aunque sea del canal de pruebas internas. Es el mismo
motivo por el que el diálogo de estrellas no aparece en un APK suelto.

La buena noticia: en pruebas internas las compras son **reales en flujo pero
sin cobro**, si las cuentas están en la lista de *License testers* de Play
Console. Se puede probar suscribirse, renovar y cancelar sin gastar un peso.

---

## 4. Lo que hay que crear en Play Console (paso 2)

Dos suscripciones, con estos IDs **exactos** — están escritos en
`src/features/premium/planes.ts` y si no coinciden, la compra falla en
silencio:

| ID del producto | Periodo | Precio de referencia |
|---|---|---|
| `candela_premium_anual` | 1 año | $39.99 |
| `candela_premium_semanal` | 1 semana | $4.99 |

Las dos con **3 días de prueba gratuita**, como dice el diseño.

> ⚠️ El precio real lo fija la ficha del producto, no la app. Los números de
> `planes.ts` son provisionales y sirven para maquetar: en cuanto RevenueCat
> esté conectado, se reemplazan por los que devuelve la tienda, que además
> vienen ya convertidos a la moneda de cada usuario. Y sigue pendiente
> confirmar con el cliente si son $39.99/$4.99 o los $32.99/$4.40 de una
> versión anterior del README.

---

## 5. Lo que toca programar (paso 3)

El terreno está preparado: `usarCompra.ts` ya tiene la forma final, con los
avisos donde irán las llamadas de verdad.

```bash
npx expo install react-native-purchases
```

Y luego, en `usarCompra.ts`:

- `Purchases.configure()` con la clave pública de RevenueCat, usando como
  **App User ID el mismo `deviceKey`** que ya identifica al dispositivo. Eso
  es lo que permite que el webhook sepa a quién conceder premium.
- `comprar()` → `Purchases.purchasePackage()`
- `restaurar()` → `Purchases.restorePurchases()`

**Premium NO se activa desde la app.** Se activa cuando RevenueCat avisa al
backend por el webhook, que ya está escrito, probado y desplegado. La app
solo pregunta al backend por su saldo, como hace ahora.

Esa decisión ya está tomada y conviene no revisarla: cualquier atajo que
conceda premium desde el teléfono es un premium gratis para quien sepa mirar
el tráfico de la app.

---

## 6. Cerrar el webhook

En Railway ya existe `REVENUECAT_WEBHOOK_SECRET` con un valor generado. Falta
llevarlo al otro lado:

1. Copiar ese valor de Railway → *Variables*.
2. En RevenueCat: *Integrations → Webhooks*.
   - URL: `https://candela-ia-mobile-production.up.railway.app/api/v1/webhooks/revenuecat`
   - Authorization header: **el mismo valor, exacto**.

Mientras no coincidan, el webhook responde 401 a todo y lo anota en los logs.
Es a propósito: una URL que reparte suscripciones a quien acierte el formato
del JSON es peor que un webhook que no funciona.

---

## 7. Hasta dónde llega el trabajo de Sebastián

**Entrega:** la app abre el cobro de Google Play, la compra se completa, el
webhook llega al backend y el usuario pasa a premium — verificado con cuentas
de prueba, sin cobro real. Más "Restaurar compras" funcionando para quien
cambie de teléfono.

**No entrega, porque no le corresponde:** la cuenta de Play Console, el perfil
fiscal, la cuenta bancaria, los precios definitivos, la ficha de la tienda ni
la decisión de publicar.

Dicho de otra forma: cuando alguien pague de verdad, ese dinero tiene que ir
directo del usuario a Google y de Google al cliente, sin pasar por ninguna
cuenta de Sebastián en ningún momento. Si en algún paso hace falta que él
ponga un dato bancario suyo, algo se configuró mal.
