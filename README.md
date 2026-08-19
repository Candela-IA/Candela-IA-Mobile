# Candela IA

> **Estado del proyecto y documento de continuidad.** Si retomas el trabajo
> en una conversación nueva, empieza leyendo esto.

**Última actualización:** 18 de agosto de 2026

---

## 1. Qué es

App móvil que ayuda a ligar. El usuario sube una captura de un chat o una
historia de Instagram y la IA le devuelve un mensaje listo para copiar, en el
tono que elija.

Es un **encargo de un cliente externo**. Sebastián desarrolla; el cliente
entrega el diseño (Figma) y pone las cuentas de infraestructura.

**Modelo de negocio:** 5 generaciones gratis por dispositivo → suscripción.
Plan anual **$39.99** / semanal **$4.99**, con 3 días de prueba.

> ⚠️ Estos son los precios del diseño de Figma, y son los que están en el
> código (`mobile/src/features/premium/planes.ts`). Una versión anterior de
> este documento decía $32.99 / $4.40 — **falta confirmar con el cliente cuál
> es el bueno**. El precio definitivo lo fija la ficha del producto en las
> tiendas, no la app.

### Las cuatro funciones

| Función | ¿Captura? | ¿Contexto? | Notas |
|---|---|---|---|
| Analizar chat | Sí | Sí | 6 tonos gratis + 3 premium |
| Analizar Stories | Sí (vertical) | No | 4 gratis + 2 premium |
| Rompehielos | No | No | Solo "Básico" gratis; 4 premium |
| Crear notas | No | Sí | Máx. 60 caracteres (límite de Instagram) |

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
`dist/` y `backend/.env`. Del entorno solo viaja `.env.example`, con
placeholders.

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

---

## 4. Stack y por qué

| Capa | Elección | Motivo |
|---|---|---|
| Backend | NestJS + TypeScript | Swagger sale solo de los decoradores |
| ORM | Prisma + MySQL 8 | Migraciones limpias, tipos automáticos |
| App | React Native + Expo | Un código para Android e iOS; compila desde Windows sin Mac |
| Navegación | expo-router | Rutas por archivos |
| IA | **GPT-5.6 Luna** (`gpt-5.6-luna`) | ~$0.0009/generación, el más barato tras comparar con Claude y Gemini |
| Pagos | RevenueCat → Google Play Billing / Apple IAP | Obligatorio para suscripciones digitales |

**Arquitectura del backend:** DDD por módulos. `domain/` no importa NestJS ni
Prisma — son reglas de negocio puras y testeables solas.

---

## 5. Qué está hecho

### Backend ✅ funcional

- 4 tablas (`devices`, `credit_balances`, `subscriptions`, `generations`)
- Registro de dispositivo sin login → JWT
- Créditos: 5 gratis de por vida + tope de 50/día para suscriptores
- Catálogo de 4 funciones y 25 tonos servido por API
- `POST /generar` con proveedor intercambiable
- Errores de dominio traducidos a HTTP (402 → paywall)
- 24 pruebas del dominio en verde
- Banco de pruebas de prompts (`npm run probar:prompts`): dispara un lote
  contra la API y lo imprime junto, con su costo y su latencia
- **Webhook de RevenueCat** (`POST /webhooks/revenuecat`): traduce los eventos
  de la tienda a estados de suscripción, con idempotencia, descarte de
  eventos fuera de orden y guard de tiempo constante. 14 pruebas de dominio

### App ✅ funcional

- Onboarding de 5 pantallas
- Home con hero, grid 2×2 y barra Inicio/Ajustes
- **Las 4 funciones generando de punta a punta**
- Sistema de diseño completo copiado del prototipo de Figma
- Selección de captura con compresión (3 MB → 200 KB)
- Vistas previas contextuales: mock de Instagram, mock de chat, respuesta
- Checklist de carga, copiar al portapapeles
- **Paywall `/premium`** completo: dos planes, ahorro calculado, pie fijo,
  enlaces legales. Se abre solo al agotar créditos (402) y desde Ajustes.
  El cobro está sin conectar y **no concede premium a nadie** (a propósito)
- **Ajustes** completo: Premium, Onboarding, Contáctanos (abre el correo),
  legal y Personalización, más la tarjeta de versión
- **Términos de Uso** dentro de la app, con el texto del prototipo. Los
  precios de la sección 9 se leen de `planes.ts`, así que no pueden
  contradecir al paywall
- **Primer arranque**: el onboarding se muestra solo la primera vez y se
  recuerda en el teléfono. Antes no lo veía nadie — solo se llegaba desde
  Ajustes
- **Personalización** con sus tres interruptores (animaciones, partículas,
  brillo neón). Se guardan en el teléfono y los respetan `FondoPantalla`,
  `TarjetaGlass` e `IconoDegradado`, así que el cambio se ve en toda la app

---

## 6. Qué falta

| Prioridad | Qué | Nota |
|---|---|---|
| 🔴 | **Validar calidad de prompts con IA real** | ~$1. Ver sección 7 |
| 🟡 | Renombrar el repo a `Candela-IA` | Se llama `-Mobile` pero tiene backend + mobile |
| 🟡 | Conectar el cobro (RevenueCat) | La pantalla ya está; falta el pago. Necesita build nativo — no corre en Expo Go |
| 🟡 | URL de la política de privacidad | Los términos ya están dentro de la app; falta este documento, que las tiendas exigen aparte |
| 🟡 | Poner `REVENUECAT_WEBHOOK_SECRET` y configurar la URL en el panel | El webhook ya está escrito; falta la cuenta del cliente |
| 🟢 | "Tu opinión" | Debe abrir la ficha de la tienda; no existe hasta publicar |
| 🟢 | Historial | Se quitó de la barra; decidir dónde va |
| 🟢 | Íconos de la app en 1024×1024 | `assets/icon.png` sigue con el de Expo |

---

## 7. ⚠️ Lo más importante pendiente

**Validar la calidad de los prompts con la IA real.** Todavía no se ha hecho.

Todo se construyó con `AI_PROVIDER="mock"`, que devuelve frases escritas a
mano. Nadie ha visto una respuesta real del modelo.

```bash
# 1. Sacar API key en platform.openai.com y cargar $5
# 2. En backend/.env:
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-proj-..."
# 3. Reiniciar el backend y disparar el lote:
npm run probar:prompts
npm run probar:prompts -- --capturas ./capturas   # incluye chat y stories
# 4. Leer cada resultado y preguntarse: ¿lo mandaría de verdad?
```

**Por qué antes que el paywall:** la calidad del mensaje **es** el producto;
lo demás es el envase. Si los mensajes no convencen, hay que ajustar
`backend/src/modules/generation/domain/prompt-builder.ts` — y sale mucho más
barato hacerlo ahora que después de construir paywall, suscripciones y tiendas.

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
- **Las preferencias de Personalización se guardan en `expo-secure-store`**,
  no en AsyncStorage: evita añadir una dependencia nativa nueva y tres
  booleanos caben de sobra en el límite de 2 KB por clave.

---

## 9. Trampas que ya nos costaron tiempo

| Síntoma | Causa |
|---|---|
| `Cannot find module 'X'` tras editar `package.json` | Falta `npm install` |
| Error de módulo nativo / codegen | Dependencia nativa **no declarada**; instalarla con `npx expo install <paquete>` |
| Cambios que "no se aplican" | El celular se desconectó de Metro (`No apps connected`) |
| Rutas nuevas que no aparecen, o cambios en `_layout.tsx` que no surten efecto | Metro cachea el mapa de rutas, y ahí entran `unstable_settings` y los hijos declarados del `Stack`. Recargar no basta → `npx expo start --clear` |
| Errores rojos en VS Code que `tsc` no ve | Servidor de TypeScript desactualizado → *Developer: Reload Window* |
| `Cannot find module 'dist/main'` | Se borró `dist` pero quedó el `.tsbuildinfo` (ya corregido) |
| "El widget Muy buena" | **No existe tal widget.** En el prototipo, "Básica"/"Muy buena" es la etiqueta de calidad que compara el tono gratis con el premium — un argumento de venta, no una calificación del usuario. La columna `rating` de `generations` quedó de esa confusión y hoy nadie la escribe |
| `fetch failed` a mitad de un lote de pruebas | `npm run dev` es `nest start --watch` y se reinició; durante esos segundos el puerto rechaza todo. Para lotes largos, arrancar con `npm run start` |

**Regla de oro:** si la terminal (`npx tsc --noEmit`) dice que está bien y el
editor dice que no, **gana la terminal**.

**Regla de paquetes:** todo lo que empiece con `expo-` o sea nativo va con
`npx expo install`, nunca con `npm install` — Expo elige la versión compatible
con el SDK.
