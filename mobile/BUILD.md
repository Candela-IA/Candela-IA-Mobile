# Generar el APK (y el AAB para la tienda)

> Hasta ahora la app se ha probado en **Expo Go**, que es una app anfitriona:
> carga tu JavaScript pero usa el código nativo de Expo, no el tuyo. Un build
> nativo es la app de verdad, con su propio icono, su nombre y su instalador.
> Es también lo que desbloquea RevenueCat, que no puede funcionar en Expo Go.

---

## 1. APK o AAB: no son lo mismo

| | Para qué | Perfil |
|---|---|---|
| **APK** | Instalarlo a mano en un teléfono. Pruebas, enseñárselo al cliente, mandarlo por WhatsApp | `preview` |
| **AAB** | Subirlo a Google Play. **La tienda no acepta APK** para apps nuevas | `production` |

Los dos salen del mismo código. Si lo que quieres es un archivo instalable
para probar, es el APK. El AAB llega cuando haya cuenta de Play Console.

---

## 2. Antes del primer build

**La cuenta de Expo debería ser del cliente**, igual que Railway y OpenAI. Es
la que va a custodiar la firma de la app, y esa firma es lo que decide quién
puede publicar actualizaciones el día de mañana.

```bash
npm install -g eas-cli
eas login
```

Y dentro de `mobile/`, una sola vez:

```bash
eas init
```

Eso crea el proyecto en la cuenta de Expo y escribe su `projectId` en
`app.json`. Ese cambio **sí va al repositorio**.

---

## 3. Pasar el examen antes de construir

```bash
npx expo-doctor
```

**No te saltes esto.** Comprueba justo lo que Expo Go tapa: dependencias
nativas sin declarar, versiones duplicadas de un módulo nativo y paquetes que
no cuadran con el SDK. En Expo Go todo eso funciona, porque la app anfitriona
ya trae esos módulos; en un build nativo van dentro del APK o no están, y el
síntoma es un cierre inesperado al arrancar o iconos que no cargan.

Si sale algo, la regla es la de siempre: todo lo que empiece por `expo-` o
sea nativo se instala con **`npx expo install`**, nunca con `npm install`.
Expo elige la versión compatible con el SDK; npm elige la última, que casi
nunca es la misma.

Las 18 comprobaciones en verde es lo que hay que ver antes de gastar veinte
minutos de cola en un build que iba a salir roto.

---

## 4. El APK

```bash
cd C:\Users\PERSONAL\Desktop\candela-ia\mobile
eas build --platform android --profile preview
```

El build corre en los servidores de Expo, no en tu laptop — no hace falta
Android Studio ni el SDK. Tarda entre 10 y 25 minutos según la cola, y al
terminar te da un enlace de descarga y un QR para instalarlo directamente en
el teléfono.

En el celular hará falta permitir *"Instalar apps de origen desconocido"*
para esa descarga. Es lo normal en un APK fuera de la tienda.

### Qué lleva dentro

El perfil `preview` fija `EXPO_PUBLIC_API_URL` al backend de Railway. **Esto
no es un detalle**: en un build nativo no existe el servidor de Expo, así que
`Constants.expoConfig.hostUri` viene vacío y `app_config.ts` caería a
`http://localhost:3000`, que en un teléfono significa el propio teléfono. La
app se instalaría bien y no funcionaría nada. Por eso la URL va en
`eas.json` y no en un `.env` local, que no viaja al servidor de build.

El perfil `development` **no** fija esa variable, a propósito: ahí sí quieres
que apunte a tu laptop mientras desarrollas.

---

## 5. La keystore: lo único irreversible

En el primer build, EAS te preguntará si le deja generar la **keystore**. Di
que sí y luego, en cuanto termine:

```bash
eas credentials
```

→ Android → *Download keystore*, y guarda ese archivo en un sitio seguro que
no sea solo tu laptop.

Por qué importa tanto: Google Play identifica una app por su firma. Si un día
se pierde esa keystore y no está el respaldo, **no se puede volver a publicar
una actualización de esa app, nunca**. Hay que subir una app nueva, con otra
ficha, y pedirles a los usuarios que se la instalen otra vez. No hay soporte
que lo arregle.

Mientras la app viva en la cuenta de Expo del cliente, la keystore está
respaldada ahí. El día que se migre la cuenta, esto es lo primero que hay que
comprobar.

---

## 6. El AAB, cuando llegue el momento

```bash
eas build --platform android --profile production
```

Sale un `.aab` para subir a Play Console. El perfil tiene `autoIncrement`,
así que el `versionCode` sube solo en cada build — la tienda rechaza dos
subidas con el mismo número, y llevarlo a mano es una fuente segura de
errores.

---

## 7. Antes de enseñárselo a nadie

- **El icono adaptativo de Android** ya está resuelto — ver abajo.
- **El peso.** `hero-home.png` son 1,6 MB y `avatar-nota.webp` otros 780 KB.
  Pasarlos por [squoosh.app](https://squoosh.app) baja el APK sin que se note
  la diferencia en pantalla.
- **RevenueCat.** El APK funcionará entero salvo el cobro: el paywall se abre
  y no concede premium a nadie, que es como está hecho a propósito. Conectar
  el pago es un paso aparte, y este build nativo es justo lo que lo permite.

---

## 8. El icono adaptativo, y por qué tiene su propio archivo

Android no recorta el icono: **lo amplía**. El lienzo son 108 dp y la ventana
visible son los 72 dp centrales, así que el 33% exterior se pierde siempre,
con cualquier launcher. Encima cada fabricante aplica su máscara —círculo,
squircle, cuadrado redondeado— sobre lo que queda.

`logo-candela.png` no servía para eso por dos razones: es **RGB sin canal
alfa** (un cuadrado negro opaco de borde a borde, con las esquinas
redondeadas pintadas encima) y la llama ocupa el 80% del lienzo, descentrada.
El resultado era la punta de la llama cortada y las dos estrellitas fuera de
cuadro.

Por eso `adaptiveIcon.foregroundImage` apunta a `adaptive-icon-candela.png`,
que se genera a partir del logo:

```bash
node scripts/generar-icono-adaptativo.js
node scripts/previsualizar-icono.js   # comparación antes/después
```

El truco está en cómo se recupera la transparencia. Un logo compuesto sobre
negro **ya es alfa premultiplicado**: un rosa (255,60,90) al 50% de cobertura
aparece como (128,30,45). Así que el alfa se recupera con `max(R,G,B)` y el
color dividiendo por él. Eso conserva el antialiasing del borde, en vez de
dejarlo dentado como haría recortar por umbral. El corazón calado queda
transparente y deja ver el `backgroundColor`, que es el mismo negro.

**Si el cliente cambia el logo**, se sustituye `logo-candela.png`, se vuelven
a correr esos dos comandos y se mira la previsualización. Los scripts no usan
ninguna dependencia: PNG a mano con el `zlib` de Node.
