# Candela IA

> **Estado del proyecto y documento de continuidad.** Si retomas el trabajo
> en una conversación nueva, empieza leyendo esto.

**Última actualización:** 21 de septiembre de 2026

---

## 1. Qué es

App móvil que ayuda a ligar. El usuario sube una captura de un chat o una
historia de Instagram y la IA le devuelve un mensaje listo para copiar, en el
tono que elija.

Es un **encargo de un cliente externo**. Sebastián desarrolla; el cliente
entrega el diseño (Figma) y pone las cuentas de infraestructura.

**Modelo de negocio:** 6 generaciones gratis **por cada función**, que se
renuevan cada semana → suscripción. Plan anual **$32.50** / semanal **$6.50**,
con 3 días de prueba.

> Son 6 en chats, 6 en Stories, 6 en notas y 6 en Rompehielos, pero **las que
> se gastan de verdad son tres**: el único tono gratis de Rompehielos sale del
> banco de frases y nunca toca el saldo. O sea, 18 generaciones gratis por
> semana y por dispositivo, no 24.

> ✅ **Confirmados por el cliente el 13 de septiembre de 2026**, después de
> meses con tres versiones distintas dando vueltas ($39.99/$4.99 y
> $32.99/$4.40 fueron las otras dos). El plan corto es **semanal**, no
> mensual: se preguntó expresamente, porque entre una cosa y otra van $338 o
> $78 al año. El precio que se cobra lo fija la ficha del producto en las
> tiendas, no la app.

### Las cuatro funciones

| Función | ¿Captura? | ¿Contexto? | Notas |
|---|---|---|---|
| Analizar chat | Sí | Sí | 6 tonos gratis + 3 premium |
| Analizar Stories | Sí (vertical) | No | 4 gratis + 2 premium |
| Rompehielos | No | No | "Básico" es **gratis de verdad**: sale de un banco de 100 frases, no gasta crédito y no llama a la IA. Los otros 4 tonos, premium |
| Crear notas | No | No | Máx. 60 caracteres (límite de Instagram) |

---

## 2. Dónde está

```
C:\Users\PERSONAL\Desktop\candela-ia\
├── backend/     NestJS + Prisma + MySQL (arquitectura DDD)
├── mobile/      React Native + Expo SDK 54
└── README.md    este archivo
```

Un solo repositorio Git en la raíz, con las dos carpetas dentro:

**https://github.com/Candela-IA/Candela-IA-Mobile** (privado)

Backend y app se versionan juntos a propósito: cambian a la vez —tocar un DTO
de NestJS obliga a tocar `candela.ts` en la app— y así ese cambio es un solo
commit que se entiende solo, en vez de dos historiales que hay que emparejar
de memoria. Railway despliega desde `backend/` sin problema indicándole ese
subdirectorio como root.

> El repositorio se llama `-Mobile` por cómo se creó. Conviene renombrarlo a
> `Candela-IA` desde Settings en GitHub: toma diez segundos y GitHub redirige
> la URL vieja, así que no rompe nada.

**Lo que NUNCA se sube** (ya cubierto por los `.gitignore`): `node_modules/`,
`dist/`, `backend/.env` y `mobile/.env`. De los dos entornos solo viajan
los `.env.example`, con placeholders y sin una sola clave.

---

## 3. Cómo levantarlo

**Backend** (terminal 1):

```bash
cd C:\Users\PERSONAL\Desktop\candela-ia\backend
npm run dev
```

→ API en `localhost:3000/api/v1` · Swagger en `localhost:3000/api/docs`

**App** (terminal 2):

```bash
cd C:\Users\PERSONAL\Desktop\candela-ia\mobile
npx expo start
```

→ Escanear el QR **desde dentro de Expo Go** (en Android no sirve la cámara).
Celular y laptop en la misma red WiFi.

**Si algo se comporta raro:** `npx expo start --clear`

**Para que la app hable con el backend desplegado** en vez de con tu laptop,
crea `mobile/.env` (copia de `.env.example`) con:

```
EXPO_PUBLIC_API_URL=https://candela-ia-mobile-production.up.railway.app/api/v1
```

Arranca con `npx expo start --clear`: el `.env` se lee al construir el bundle,
así que sin limpiar la caché el cambio no se aplica. Comenta la línea para
volver a tu laptop. Sin `.env`, la app se conecta sola a la IP de red que
Expo ya conoce, que es lo cómodo para el día a día.

> ⚠️ **El backend está en `AI_PROVIDER="openai"` con una clave real.** Cada
> generación cuesta ~$0.0006 y se descuenta del saldo prepago de OpenAI. Es
> poco —el lote completo de pruebas son dos centavos— pero ya no es gratis.
> Para trabajar en la interfaz sin gastar, pon `AI_PROVIDER="mock"`.

---

## 4. Stack y por qué

| Capa | Elección | Motivo |
|---|---|---|
| Backend | NestJS + TypeScript | Swagger sale solo de los decoradores |
| ORM | Prisma + MySQL 8 | Migraciones limpias, tipos automáticos |
| App | React Native + Expo | Un código para Android e iOS; compila desde Windows sin Mac |
| Navegación | expo-router | Rutas por archivos |
| IA | **GPT-5.6 Luna** (`gpt-5.6-luna`) | ~$0.0006/generación (medido), el más barato tras comparar con Claude y Gemini |
| Pagos | RevenueCat → Google Play Billing / Apple IAP | Obligatorio para suscripciones digitales |

**Arquitectura del backend:** DDD por módulos. `domain/` no importa NestJS ni
Prisma — son reglas de negocio puras y testeables solas.

---

## 5. Qué está hecho

### Backend ✅ funcional

- 4 tablas (`devices`, `credit_balances`, `subscriptions`, `generations`)
- Registro de dispositivo sin login → JWT
- Créditos: **6 gratis POR FUNCIÓN que se renuevan cada 7 días** (ventana
  rodante, no un día fijo, y las cuatro bolsas vuelven a la vez) + tope de
  50/día por dispositivo para suscriptores
- Catálogo de 4 funciones y 26 tonos servido por API
- `POST /generar` con proveedor intercambiable
- Errores de dominio traducidos a HTTP (402 → paywall)
- 70 pruebas en verde: 21 de los créditos, 14 de las suscripciones, 14 del
  banco de rompehielos, 6 del guardia de ortografía y 15 del entorno
- Banco de pruebas de prompts (`npm run probar:prompts`): dispara un lote
  contra la API y lo imprime junto, con su costo y su latencia
- `GET /salud` para el health check de la plataforma: comprueba la base de
  datos, no solo que el proceso viva
- Listo para desplegar: apagado limpio, proxy de confianza para que el
  limitador vea la IP real, Swagger detrás de una variable, `railway.toml` con
  el arranque y el health check, y una **comprobación del entorno al
  arrancar** que mata el proceso si falta algo esencial o si alguien intenta
  levantar producción con el proveedor falso
- **🚀 Desplegado en Railway** (25 de agosto de 2026), en la cuenta del
  cliente, con MySQL gestionado en el mismo proyecto:

  **https://candela-ia-mobile-production.up.railway.app/api/v1**

  Verificado de punta a punta: `/salud` responde 200 con `baseDatos: "ok"`,
  el catálogo sirve las 4 funciones, registrar un dispositivo devuelve JWT y
  saldo completo —o sea que la migración creó las tablas y se escriben—, y los
  endpoints que cuestan dinero (`/generar`) o reparten suscripciones
  (`/webhooks/revenuecat`) devuelven 401 sin credenciales. `/api/docs` da
  404, que es lo que debe dar en producción.

  Y **una generación real contra OpenAI**, que es lo único que no se puede
  probar gratis: 200 en 3,7 s, mensaje con voz de persona (no las frases
  enlatadas del modo falso) y el crédito descontado en la misma
  respuesta. La clave de producción sirve y el circuito entero funciona
- **Swagger publicado** en `/api/docs`, para que el cliente pueda verificar
  la API por su cuenta. Ver la decisión en la sección 8
- **Webhook de RevenueCat** (`POST /webhooks/revenuecat`): traduce los eventos
  de la tienda a estados de suscripción, con idempotencia, descarte de
  eventos fuera de orden y guard de tiempo constante. 14 pruebas de dominio
- **Rompehielos gratis no cuesta nada**: el tono Básico devuelve una de 100
  frases escritas a mano (`domain/rompehielos.ts`) en vez de llamar a la IA.
  Un rompehielos no tiene captura ni contexto que analizar, así que el modelo
  recibía siempre la misma petición. Ahora cuesta $0, responde al instante y
  **no gasta ninguno de los créditos**, ni siquiera con el saldo agotado.
  Los cuatro tonos premium de esa función sí pasan por la IA
- **Regenerar pide otro ángulo**: `esRegeneracion` viaja hasta el modelo, en
  el mensaje de usuario y no en el de sistema, para no romper la caché
- **Dar premium a mano** (`npm run premium -- <deviceKey> [...]`): concede o
  retira suscripción a uno o varios dispositivos, para promociones o para
  compensar a alguien. `--listar` muestra los últimos por actividad, que es
  como se identifica a una persona. Repartir un APK con premium activado
  sería la alternativa mala: un binario se filtra, y quien lo tenga genera
  gratis a costa del saldo de OpenAI del cliente
- **Un prompt por tono** (10 de septiembre de 2026, petición del cliente): los
  26 tonos pasaron de dos frases sueltas a un bloque de cuatro partes — qué
  buscas, cómo suena, nunca, y un ejemplo calibrado. Antes lo único que
  separaba "Divertida" de "Seguro" eran esas dos frases, y por eso a veces se
  parecían más de lo que debían
- **El tono se movió al FINAL del prompt de sistema.** OpenAI cachea por
  prefijo: con el tono en medio, las reglas y los ejemplos quedaban detrás de
  un texto que cambia 26 veces. Ahora el bloque común son 10 111 caracteres
  (~2 800 tokens) idénticos para las cuatro funciones y los veintiséis tonos,
  por encima del mínimo de 1 024 que OpenAI exige para cachear. Y lo último
  que lee el modelo es el tono, que es donde más caso hace

  > ⚠️ **El ahorro está sin demostrar.** El lote del 10 de septiembre salió a
  > **$0.00112 por generación**, más caro que el $0.00089 de la víspera — pero
  > los dos números no son comparables: aquel promediaba generaciones sin
  > imagen, que cuestan bastante menos. Lo único limpio que se puede afirmar
  > es que los tokens de entrada por generación subieron un 4%, exactamente lo
  > que creció el prompt. Para saber si el reordenado ahorra algo hay que leer
  > el `caché X/Y` que el backend registra en cada generación, y eso pide
  > correr el lote con los logs del servidor a la vista. Está sin hacer.
- **Prompts contra las muletillas**: el modelo cerraba casi todas las
  respuestas proponiendo "un café" y empezando por "Entonces". La regla 10 lo
  prohíbe y añade la prueba del algodón — si el mensaje encajaría igual en
  otra conversación, es muletilla y se reescribe
- **Los intentos gratis son de cada función** (5 de septiembre de 2026,
  petición del cliente): cuatro bolsas de 6 en vez de una compartida, en
  cuatro columnas de `credit_balances` y no en una tabla aparte, para que el
  `SELECT ... FOR UPDATE` que ya existía siga protegiendo el saldo entero con
  un solo bloqueo. Las columnas arrancan en 0 y no heredan la bolsa vieja:
  sembrarlas con lo gastado dejaría las cuatro vacías justo a quien el cambio
  pretendía dar más. La respuesta trae un contador por función, y mantiene
  los campos sumados que lee el APK anterior
- **Voz gen Z e irónica, y un trabajo que cumplir** (5 de septiembre de 2026,
  pedido del cliente): la persona ahora tiene veintipocos y escribe con humor
  seco en vez de piropos de otra época, y la consigna dice para qué sirve el
  mensaje — abrir el chat o mantenerlo vivo. Uno al que solo se pueda
  contestar "jajaja" está mal aunque tenga gracia. Dos cuidados que no son
  obvios: la ironía va en QUÉ se dice y no en escribir sin tildes (la regla 1
  no se toca), y se subordina al tono elegido, porque un Romántico irónico no
  es Romántico sino una burla que el usuario mandaría creyendo otra cosa
- **Los prompts ya no marcan nacionalidad** (misma petición: "nada de
  nacionalidad... ceviche, etc"). La persona escribía "con la jerga que se usa
  en Perú" y el banco hacía elegir entre ceviche y pollo a la brasa; para
  alguien de México o Colombia eso no es cercanía, es un mensaje que delata
  que lo escribió otro. Cambiaron la persona, la regla 9, un ejemplo del
  prompt y tres frases del banco, y hay una prueba que vigila que no vuelvan.
  También cubre los planes: se propone "hay que salir" o "te debo una comida",
  nunca "vamos por un ceviche"

### App ✅ funcional

- Onboarding de 5 pantallas
- Home con hero, grid 2×2 y barra Inicio/Ajustes
- **Las 4 funciones generando de punta a punta**
- Sistema de diseño completo copiado del prototipo de Figma
- Selección de captura con compresión (3 MB → 200 KB)
- Vistas previas contextuales: mock de Instagram, mock de chat, respuesta
- Checklist de carga, copiar al portapapeles
- **Las capturas se borran** en cuanto cumplen su función: al cambiarlas, al
  quitarlas y al salir de la pantalla. El backend nunca las guarda ni las
  registra — solo función, tono, tokens, costo y latencia
- **Red de seguridad ante errores**: una excepción muestra una pantalla con
  salida en vez de dejar la app en blanco
- 11 pruebas de los números del paywall
- **Analizar chat y Stories en tres pantallas**: formulario → análisis con
  la captura escaneándose → resultado con el mensaje y las dos acciones
- **Paywall `/premium`** completo: dos planes, ahorro calculado, pie fijo,
  enlaces legales. Se abre solo al agotar créditos (402) y desde Ajustes
- **El cobro, conectado con RevenueCat** (16 de septiembre de 2026). El SDK
  vive aislado en `revenuecat.ts` y se carga a demanda, porque es nativo y en
  Expo Go no existe. Lo que NO hace, a propósito, es conceder premium desde
  el teléfono: eso lo decide el backend cuando le llega el webhook, y
  cualquier atajo sería premium gratis para quien mire el tráfico. Como entre
  que Google cobra y el webhook llega pasan segundos, tras comprar la app le
  pregunta al backend hasta seis veces antes de rendirse
- **Una clave de RevenueCat por tienda** (21 de septiembre de 2026). La de
  Android está puesta; la de Apple es `null` hasta que exista la cuenta del
  cliente, y mientras tanto el iPhone se comporta como un build sin tienda en
  vez de arrancar el SDK con la clave de Google. Cuatro pruebas lo vigilan
- **✅ Probada en el simulador de iOS** (25 de septiembre de 2026, Xcode 16.4
  con iOS 18.6): las cuatro funciones generan contra Railway, el diseño no
  necesitó un solo ajuste y el paywall degrada como debe. El detalle y los
  tropiezos del camino, en la Parte 0 de [`mobile/IOS.md`](mobile/IOS.md)
- **Ajustes** completo: Premium, Onboarding, Contáctanos (abre el correo),
  legal y Personalización, más la tarjeta de versión
- **Enlaces legales** a los documentos publicados por el cliente:
  `candela-ia.vercel.app/terminos-de-uso` y `/politica-de-privacidad`. Viven
  en la web y no dentro de la app a propósito: así se corrigen sin publicar
  versión nueva, y la misma URL vale para la ficha de Google Play, que
  también la exige fuera de la app
- **Primer arranque**: el onboarding se muestra solo la primera vez y se
  recuerda en el teléfono. Antes no lo veía nadie — solo se llegaba desde
  Ajustes
- **Icono adaptativo de Android** resuelto: `adaptive-icon-candela.png` se
  genera desde el logo con `scripts/generar-icono-adaptativo.js`, con la llama
  centrada al 66% y fondo transparente. El logo original es RGB sin alfa y
  llenaba el lienzo, así que Android le cortaba la punta y las estrellitas
- **📱 APK nativo funcionando**, construido con EAS desde el proyecto
  `@candela-ia/candela-ia` (ver [`mobile/BUILD.md`](mobile/BUILD.md)).
  Probado en tres teléfonos distintos contra el backend de Railway
- **📦 AAB para la tienda**: `versionCode 4`, construido el 17 de septiembre
  de 2026 para la prueba cerrada. Sale del perfil `production`, que lleva
  `autoIncrement`: el número sube solo, y Play rechaza dos subidas con el
  mismo — que es justo lo que pasó con el 3
- Correcciones salidas de esas pruebas: la vista previa de la captura se ve
  **entera y centrada** (antes `cover` la recortaba), las cuatro tarjetas del
  inicio **miden lo mismo** aunque un título ocupe dos líneas, el botón
  principal **no parte su texto** y respeta la letra grande del sistema hasta
  1.3×, y los tres efectos de Personalización **se notan al apagarlos** — no
  estaban rotos, eran invisibles
- **Aguanta la letra grande del sistema y las tablets**: los altos del inicio
  se multiplican por el `fontScale` real del dispositivo (`altoSegunFuente`),
  y el contenido se queda al ancho de un teléfono y centrado en pantallas
  anchas. Ambos fallos los encontró el cliente, no las pruebas
- **Enlaces legales** a los documentos del cliente:
  `candela-ia.vercel.app/terminos-de-uso` y `/politica-de-privacidad`. Viven
  en la web y no dentro de la app a propósito: se corrigen sin publicar
  versión, y Google Play exige la URL fuera de la app
- **"Tu opinión"** abre las estrellas de Google Play (`expo-store-review`),
  con caída a la ficha de la tienda. **No se puede probar hasta publicar**:
  ese diálogo lo pinta Play y solo aparece si la app se instaló desde ahí
- **El ID del dispositivo se ve en Ajustes**, tocable para copiarlo. Sin
  login es lo único que identifica a alguien en soporte, y lo que hace falta
  para concederle premium
- **EAS Update montado**: los cambios de JavaScript y assets llegan con
  `eas update`, sin pasar por la tienda. `runtimeVersion` va en modo
  `fingerprint`, así un update que necesite código nativo nuevo NO se envía a
  builds antiguos que no lo llevan — sin eso, la app se cerraría al llamarlo
- **Reintenta sola** cuando el servidor no responde: hasta dos veces con
  espera creciente. Los GET siempre; los POST solo si fallaron en menos de
  2,5 s, porque generar tarda 3-8 y un fallo más tardío pudo haberse cobrado
  ya. Nace de que un despliegue le cortó una generación al cliente
- **Preparada para iPhone**: bundle, icono, permiso de fotos con su texto
  obligatorio y cifrado declarado. Falta solo la cuenta de Apple — ver
  [`mobile/IOS.md`](mobile/IOS.md)
- **Personalización** con sus tres interruptores (animaciones, partículas,
  brillo neón). Se guardan en el teléfono y los respetan `FondoPantalla`,
  `TarjetaGlass` e `IconoDegradado`, así que el cambio se ve en toda la app
- **El brillo neón bajó ~35%** (5 de septiembre de 2026, "brillo neón un poco
  menos"). Se tocaron las opacidades de las capas del halo, la sombra de iOS y
  la elevación de Android en `TarjetaGlass` e `IconoDegradado`, en la misma
  proporción para que tarjetas e iconos sigan brillando igual entre sí. El
  número de capas no se toca: son las que hacen que el halo parezca desenfoque
  y no un marco
- **La vista previa ya no enseña un ejemplo**: antes se pintaba un mensaje de
  muestra con una insignia "EJEMPLO" para que la pantalla no arrancara vacía.
  El cliente lo quitó, y con razón: era una respuesta que nadie había pedido,
  ocupando el sitio exacto donde iba a aparecer la de verdad. Ahora el bloque
  aparece al generar, o mientras se genera si hay captura

---

## 6. Qué falta

| Prioridad | Qué | Nota |
|---|---|---|
| 🔴 | **Que el cliente ponga método de pago en Railway** | Cuando se agote el trial, el backend se apaga y la app deja de responder para todos — el APK y el AAB apuntan ahí. Es lo único del proyecto con cuenta atrás |
| 🔴 | **Que el cliente configure el webhook en el panel de RevenueCat** | El secreto ya está en Railway; falta pegarlo en el panel junto con la URL `/api/v1/webhooks/revenuecat`. Sin eso, en la prueba cerrada los testers pagan y el premium no llega nunca, y parece que la app está rota. Cuidado con el NOMBRE de la variable: la trampa está documentada en [`mobile/PAGOS.md`](mobile/PAGOS.md) |
| 🔴 | **La prueba cerrada en Play** | El AAB `versionCode 4` se construyó y entregó el 17 de septiembre de 2026 (el 3 ya estaba usado por la prueba interna). Si la cuenta de Play es personal, la prueba cerrada exige **12 testers dentro durante 14 días seguidos** antes de poder pedir producción, y el contador se reinicia si bajan de 12 |
| 🟡 | Crear las dos suscripciones en Play Console | Con los IDs exactos de `planes.ts`, y ojo al periodo: una vez creada, la facturación de una suscripción no se puede cambiar. Depende del perfil de pagos del cliente, que Google tarda días en verificar. Paso a paso en [`mobile/PAGOS.md`](mobile/PAGOS.md) |
| 🟡 | Renombrar el repo a `Candela-IA` | Se llama `-Mobile` pero tiene backend + mobile |
| 🟡 | Revisar los precios de GPT-5.6 Luna | OpenAI anunció una bajada del 80%. Los precios están escritos a mano en `openai.provider.ts`; si están desfasados, la columna `costUsd` lleva anotando de más |
| 🟢 | Capturas de prueba de verdad | `capturas/chat/` y `capturas/stories/` tienen la MISMA imagen en `.jpg`, `.png` y `.webp`, así que cada lote paga tres veces por la misma conversación. Cambiarlas por tres conversaciones distintas mediría variedad en vez de formatos |
| 🟢 | Historial | Se quitó de la barra; decidir dónde va |
| 🟢 | Llevarlo a iPhone | **Ya corre**: probada en el simulador el 25 de septiembre de 2026, sin un solo ajuste de diseño (Parte 0 de [`mobile/IOS.md`](mobile/IOS.md)). Lo que falta no es código: son los 99 USD al año de la cuenta de Apple, sin los cuales no hay TestFlight, ni iPhone de verdad, ni forma de probar el cobro. Y con esa cuenta viene la clave `appl_` de RevenueCat |
| 🟢 | Reporte de fallos (Sentry) | El `ErrorBoundary` ya está; falta la cuenta y diez líneas |
| 🟢 | `avatar-nota.webp` pesa 780 KB | Los PNG ya se optimizaron con `scripts/optimizar-imagenes.js`, que no sabe de WebP. Este va a mano por squoosh.app |

---

## 7. ✅ Los prompts están validados

**Hecho el 21 de agosto de 2026.** Era la duda más cara del proyecto: todo se
construyó con `AI_PROVIDER="mock"` y nadie había visto una respuesta real
del modelo. Ya no.

Se dispararon 31 generaciones reales con `npm run probar:prompts` sobre las
cuatro funciones, incluidas capturas de chat y de historias.

| | |
|---|---|
| Generaciones | 31 |
| Costo total | **$0.0182** |
| Por generación | **$0.00059** |
| Latencia media | 3.3 s |

### Medido otra vez el 9 de septiembre de 2026

31 generaciones, esta vez **con las dos funciones de imagen**, que en el lote
de agosto se habían quedado fuera.

| | agosto | septiembre |
|---|---|---|
| Por generación | $0.00059 | **$0.00089** |
| Latencia media | 3,3 s | **5,0 s** |

Subió la mitad, y era de esperar: entre medias entraron los ejemplos, la
ortografía impecable, el español sin nacionalidad y la voz gen Z — solo el 5
de septiembre el prompt de sistema creció un 29%. Sigue cacheado al 10%, así
que de ese crecimiento se paga una décima parte.

**Qué salió bien:** el modelo lee la captura de verdad (las respuestas
hablaban de la clase, del enlace y del perro del meme que salían en el chat),
no se coló una sola referencia local, la ironía aterrizó sin volverse chiste
fácil, y las notas respetaron los 60 caracteres.

**Lo que falla, y es la regla 1:** de 31 mensajes, **uno salió en minúscula**
—"gracias, me salvaste. ya entro…"—, justo en Salvar situación. Es el riesgo
que trae la voz gen Z, y el ejemplo que ya está en el prompt no lo atrapó esa
vez. Un 3% no es alarmante, pero es la regla que el cliente pidió por escrito.

**Arreglado el mismo día**, en los dos sitios: el prompt lo repite donde más
pesa (la descripción del campo `mensaje`, que es lo último que el modelo lee
antes de escribirlo) y `domain/ortografia.ts` lo garantiza pase lo que pase.
Solo la mayúscula inicial — las tildes que falten no se pueden poner sin
entender la frase, y ese trabajo sigue siendo del prompt. Cuando el guardia
actúa deja un aviso en el log: si empieza a saltar seguido, el problema no se
arregla ahí sino en el prompt.

**Otros dos** cerraron sin dejar por dónde seguir, que es lo que la consigna
nueva pide evitar. Nueve de cada diez sí dejaban puerta.

**Salió un tercio más barato de lo estimado** ($0.0009 era la previsión). El
prompt de sistema es idéntico entre peticiones del mismo tono, así que
OpenAI lo cachea y cobra el 10% por esa parte — de 1250 tokens de entrada,
unos 980 vienen de caché.

Qué se comprobó en las respuestas:

- **El modelo lee la imagen de verdad.** Las respuestas a una historia de un
  brownie hablaban del brownie, no de genéricos.
- **Suena a persona.** Frases cortas, minúscula inicial, jerga peruana
  ("nomás") — la instrucción de persona aterriza.

  > ⚠️ Esa minúscula inicial **ya no vale**. El 26 de agosto el cliente pidió
  > ortografía impecable, y la regla 1 pasó a exigir mayúsculas, tildes y
  > signos de apertura siempre. El motivo pesa: el usuario copia el mensaje y
  > lo manda tal cual, así que una falta acaba siendo suya delante de la
  > persona que le gusta. El registro se sigue copiando en todo lo demás,
  > y el cambio está **sin medir** con el banco de pruebas.
- **Invitan a responder.** Proponen algo concreto en vez de cerrar con una
  frase que solo admita "jaja sí".

Si algún día hay que ajustar el tono, se toca
`backend/src/modules/generation/domain/prompt-builder.ts` y se vuelve a
correr el lote por dos centavos.

---

## 8. Decisiones tomadas (no volver a discutirlas sin motivo)

- **Sin login.** Identidad por `ANDROID_ID` (Android) y UUID en Keychain (iOS).
  Ambos sobreviven a desinstalar, así que reinstalar no regala 5 intentos.
- **1 acción = 1 crédito**, sin excepciones. Regenerar cuesta igual.
- **El crédito se cobra ANTES de llamar a la IA** y se devuelve si falla. Al
  revés, dos peticiones simultáneas se saltarían el tope.
- **El catálogo se sirve por API.** Permite mover un tono a premium o cambiar
  textos **sin publicar versión en las tiendas**.
- **Una sola pantalla para las 4 funciones.** Lo que las diferencia lo dice el
  catálogo.
- **Android primero**, iOS después (mismo código, otro comando de compilación).
- **El cobro va por Google Play Billing, no por Google Pay.** Son cosas
  distintas: Google Pay es para bienes y servicios del mundo real; el
  contenido digital dentro de una app publicada en Play tiene que pasar
  obligatoriamente por Play Billing, y saltárselo es causa de retirada de la
  app. La experiencia es la misma que se espera —sube una hoja de Google con
  las tarjetas que el usuario ya tiene guardadas—, solo cambia el mecanismo.
  En iOS, Apple IAP. RevenueCat envuelve los dos.
- **Swagger está publicado en producción, a propósito.** `SWAGGER="true"` en
  Railway. La razón es que el cliente paga el desarrollo y quiere poder
  verificar la API sin depender de que alguien se la enseñe. El coste de esa
  decisión es real y conviene tenerlo presente: con la API documentada,
  `POST /dispositivos/registrar` es una invitación a inventar `deviceKey` y
  quemar saldo de OpenAI a 5 generaciones por dispositivo. Lo que hace la
  decisión asumible es que **la cuenta de OpenAI es prepago**: el daño máximo
  es agotar el saldo y que la app deje de generar hasta recargar, no una
  factura sorpresa. Por eso, mientras esto siga público, **no se activa la
  recarga automática** en OpenAI — eso quitaría el techo. Si algún día se
  activa, hay que apagar Swagger el mismo día
- **Las preferencias de Personalización se guardan en `expo-secure-store`**,
  no en AsyncStorage: evita añadir una dependencia nativa nueva y tres
  booleanos caben de sobra en el límite de 2 KB por clave.

---

## 9. Trampas que ya nos costaron tiempo

| Síntoma | Causa |
|---|---|
| `Cannot find module 'X'` tras editar `package.json` | Falta `npm install` |
| Error de módulo nativo / codegen | Dependencia nativa **no declarada**; instalarla con `npx expo install <paquete>` |
| La app va en Expo Go pero el build nativo se cierra al arrancar, o no cargan los iconos | Expo Go trae sus propios módulos nativos y tapa los que faltan; un APK solo lleva los declarados. `npx expo-doctor` lo dice antes de gastar veinte minutos de cola |
| Cambios que "no se aplican" | El celular se desconectó de Metro (`No apps connected`) |
| Rutas nuevas que no aparecen, o cambios en `_layout.tsx` que no surten efecto | Metro cachea el mapa de rutas, y ahí entran `unstable_settings` y los hijos declarados del `Stack`. Recargar no basta → `npx expo start --clear` |
| Errores rojos en VS Code que `tsc` no ve | Servidor de TypeScript desactualizado → *Developer: Reload Window* |
| `Cannot find module 'dist/main'` | Se borró `dist` pero quedó el `.tsbuildinfo` (ya corregido) |
| "El widget Muy buena" | **No existe tal widget.** En el prototipo, "Básica"/"Muy buena" es la etiqueta de calidad que compara el tono gratis con el premium — un argumento de venta, no una calificación del usuario. La columna `rating` de `generations` quedó de esa confusión y hoy nadie la escribe |
| `fetch failed` a mitad de un lote de pruebas | `npm run dev` es `nest start --watch` y se reinició; durante esos segundos el puerto rechaza todo. Para lotes largos, arrancar con `npm run start` |
| El backend sirve código viejo aunque los push estén en GitHub | Railway dejó de detectar los commits (`GitHub Repo not found` en Settings → Source). El health check sigue verde, así que no se nota: hay que mirar `activoDesdeSegundos` en `/salud`. Un día entero de commits acumulados costó esto |
| `Prisma has no exported member DeviceGetPayload` justo después de un `npm ci` | El cliente de Prisma **se genera**, no se descarga: sus tipos salen del `schema.prisma`, y `npm ci` no siempre dispara esa generación. Parecen errores del código y no lo son → `npx prisma generate`. Por eso `npm run build` lo corre antes de compilar, y por eso el despliegue no depende de que ocurra solo |

**Regla de oro:** si la terminal (`npx tsc --noEmit`) dice que está bien y el
editor dice que no, **gana la terminal**.

**Regla de paquetes:** todo lo que empiece con `expo-` o sea nativo va con
`npx expo install`, nunca con `npm install` — Expo elige la versión compatible
con el SDK.
