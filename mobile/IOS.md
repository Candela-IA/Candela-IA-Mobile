# Candela IA en iPhone

> Qué se puede hacer hoy sin pagar nada, qué hace falta para publicar de
> verdad, y **quién hace cada cosa**.

---

## Lo esencial, en treinta segundos

- **No hace falta un Mac.** EAS compila para iPhone desde Windows.
- **No hay que reprogramar nada.** El mismo código que corre en Android
  funciona en iOS; ya está configurado.
- **No se puede convertir el APK.** Son sistemas incompatibles, y aunque no
  lo fueran, iOS solo ejecuta apps firmadas por Apple.
- **El único requisito real son 99 USD al año** de la cuenta de Apple
  Developer, y son del cliente.
- Sin pagar, hay **dos formas de verla** — con límites, pero suficientes para
  decidir.

---

# PARTE 1 · Verla hoy, sin pagar nada

## Opción A — En el iPhone del cliente, con Expo Go

La más rápida y la que enseña la app de verdad, en su propio teléfono.

### Lo que hace Sebastián

```bash
cd C:\Users\PERSONAL\Desktop\candela-ia\mobile
npx expo start --tunnel
```

Aparece un QR en la terminal. **El `--tunnel` no es opcional**: sin él, el
cliente tendría que estar conectado a la misma WiFi. Con él, funciona aunque
esté en otra ciudad con sus datos móviles.

Deja esa ventana abierta mientras él prueba. Si la cierras, la app deja de
cargar.

### Lo que hace el cliente

1. Instalar **Expo Go** desde el App Store (gratis).
2. Abrir la **cámara normal** del iPhone y apuntar al QR.
3. Tocar el aviso que aparece arriba; se abre en Expo Go.

### Qué verá y qué no

| Funciona | No funciona |
|---|---|
| Las 4 funciones generando de verdad | Las actualizaciones por aire |
| El backend de Railway, con sus créditos | La valoración con estrellas |
| Todo el diseño, tonos y paywall | Los pagos (cuando existan) |

Esas tres cosas necesitan un build propio, y Expo Go trae los suyos. Para
juzgar diseño y funcionamiento es fiel.

> **Límite honesto:** depende de que la laptop de Sebastián esté encendida y
> con el comando corriendo. Sirve para enseñar, no para que el cliente la use
> a diario.

---

## Opción B — Un iPhone virtual en el navegador

Para que lo vea sin depender de nadie, o para enseñárselo a más gente.

### Lo que hace Sebastián

```bash
cd C:\Users\PERSONAL\Desktop\candela-ia\mobile
eas build --platform ios --profile ios-simulador
```

Sale un archivo `.tar.gz` descargable desde el enlace que da EAS.

Esto funciona sin cuenta de Apple porque **los builds de simulador no se
firman**, y la firma es justo lo que Apple cobra.

Después:

1. Descargar ese archivo y descomprimirlo (sale una carpeta `.app`).
2. Crear una cuenta gratuita en [appetize.io](https://appetize.io).
3. Subir la carpeta `.app` y elegir un modelo de iPhone.
4. Appetize da un **enlace público**.

### Lo que hace el cliente

Abrir ese enlace en cualquier navegador. Ya está: un iPhone dentro de la
pantalla, con la app corriendo, sin instalar nada.

> **Límites:** el plan gratuito de Appetize da unos 100 minutos al mes y la
> sesión se corta sola cada pocos minutos. Es para mirar y decidir, no para
> usarla.

---

# PARTE 2 · Publicar de verdad en el App Store

Aquí sí hay que pagar. Nada de esta parte se puede empezar sin el paso 1.

## Lo que SOLO puede hacer el cliente

**1. Abrir la cuenta de Apple Developer — 99 USD al año**

En [developer.apple.com/programs](https://developer.apple.com/programs).

Dos decisiones que conviene tomar bien a la primera:

- **A su nombre o al de una empresa.** Como persona física es inmediato, pero
  la app aparece publicada con su nombre real y completo, visible para
  cualquiera. Como empresa sale el nombre comercial, pero Apple exige un
  **número D-U-N-S**, que es gratuito y puede tardar **entre días y semanas**.
  Si quiere que salga la marca, hay que empezar por ahí ya.
- **Que la cuenta sea suya, no de Sebastián.** Igual que en Google: ahí va el
  dinero y ahí queda la propiedad de la app.

> ⚠️ **Los 99 USD son recurrentes.** El día que se dejen de pagar, la app
> desaparece del App Store aunque lleve años publicada y con miles de
> usuarios. No es un pago de entrada, es una cuota.

**2. Invitar a Sebastián** como *Developer* o *App Manager* desde
App Store Connect → Users and Access. Eso da acceso técnico, nunca al dinero.

**3. Rellenar los datos bancarios y fiscales** en App Store Connect →
Agreements, Tax and Banking. Como en Google: **esto no lo toca Sebastián
nunca**. Si el dinero pasara por su cuenta, tributaría a su nombre y la app
quedaría atada a él.

**4. Prestar un iPhone** para las pruebas, aunque sea un rato. No hace falta
comprarlo, pero sí probarlo en uno real antes de publicar.

**5. Redactar la ficha**: descripción, palabras clave, categoría y
clasificación por edad. Siendo una app de ligar, lo más probable es **17+**.

## Lo que hace Sebastián

**1. Registrar los iPhones de prueba**

```bash
eas device:create
```

Genera un enlace que se abre **desde el iPhone** e instala un perfil. Hasta
100 dispositivos al año.

**2. Crear la app en App Store Connect** con el identificador que ya está en
el código: `com.candelaia.app`.

**3. El primer build**

```bash
eas build --platform ios --profile production
```

EAS pide las credenciales de Apple, genera los certificados y guarda todo.
No hace falta entender de firmas.

**4. Subirlo a TestFlight**

```bash
eas submit --platform ios --latest
```

**5. Que el cliente lo pruebe** por TestFlight (él instala esa app gratuita y
acepta la invitación por correo).

**6. Ajustar lo que salga.** Habrá detalles propios de iOS: el notch, los
gestos de volver, las áreas seguras. Los mismos ajustes de tamaños que se
fueron corrigiendo en Android.

**7. Enviar a revisión** cuando el cliente dé el visto bueno.

---

# PARTE 3 · Lo que no se puede hacer, y por qué

**Convertir el APK a iPhone.** Un APK lleva código compilado para el runtime
de Android; iOS necesita un binario para el de Apple. No hay conversor porque
no puede haberlo. Y aunque lo hubiera, iOS no ejecuta apps sin firma de
Apple.

**Pasarle un archivo para que lo instale**, como se hizo con el APK. iOS no
tiene "orígenes desconocidos". Solo entra por TestFlight o por el App Store.

**Probar las compras fuera de TestFlight.** Apple IAP solo responde si la app
viene de la tienda. Igual que Google Play Billing.

---

# PARTE 4 · Dónde puede rechazarla Apple

Google revisa casi en automático; Apple pone a una persona. Por orden de
riesgo para esta app:

**Contenido generado por IA (guía 1.2).** Piden filtros y una forma de
reportar abusos. Juega a favor que el prompt ya prohíbe lo vulgar y lo sexual
explícito, y que tiene una regla —la 7— que impide sugerir formas de insistir
a alguien que mostró desinterés. Eso es exactamente lo que un revisor busca.

**Categoría de citas (guía 1.1.4).** Verificación de edad; probablemente 17+.

**Suscripciones (guía 3.1.1).** Obligatorio Apple IAP, con su comisión.
RevenueCat ya envuelve las dos tiendas, así que es el mismo trabajo que ya
está planificado para Android.

**Privacidad (guía 5.1.1).** Hay que rellenar la etiqueta de datos. Aquí la
app parte con ventaja real y conviene aprovecharla: **no guarda las capturas
ni el texto de las conversaciones**, solo metadatos de uso. Se puede declarar
con honestidad, y eso se nota.

**Poco valor (guía 4.2).** El rechazo más común en apps sencillas. La defensa
es una ficha que enseñe bien qué hace: capturas reales de las cuatro
funciones, no solo el logo.

---

# PARTE 5 · Qué hacer y en qué orden

**Ahora, sin gastar nada:**

1. Enseñársela por **Expo Go** (Opción A) — cinco minutos.
2. Si quiere verla con calma, el **iPhone virtual** (Opción B).
3. Que decida si compensa.

**Si decide seguir:**

4. **Terminar Android del todo primero**: publicar, comprobar que las
   suscripciones cobran, corregir lo que aparezca. Cada problema resuelto en
   Android llega a iOS ya arreglado, y el reloj de los 99 USD empieza a
   correr en cuanto se abre la cuenta.
5. Si quiere la app a nombre de una empresa, **pedir el D-U-N-S ya**, porque
   es lo que más tarda.
6. Abrir la cuenta, invitar a Sebastián, datos bancarios.
7. Build → TestFlight → probar en un iPhone real → revisión.

## Lo que ya está resuelto en el código

| | |
|---|---|
| Identificador `com.candelaia.app` | Puesto, igual que en Android |
| Icono | Vale tal cual: iOS lo quiere opaco y sin esquinas redondeadas |
| Permiso de fotos | Con su texto explicativo, obligatorio para pasar revisión |
| Cifrado declarado | Evita la pregunta de Apple en cada subida |
| Las cuatro funciones, diseño y backend | El 95% del trabajo, ya hecho |
