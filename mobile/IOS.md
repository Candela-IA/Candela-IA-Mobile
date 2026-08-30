# Llevar Candela a iPhone

> El código ya sirve: React Native compila para las dos plataformas y EAS
> construye para iOS **desde Windows, sin Mac**. Lo que falta es todo lo de
> alrededor — y con Apple, ese "alrededor" es la parte cara.

---

## 1. Lo que cuesta, y no es solo dinero

| | Android (ya hecho) | iOS |
|---|---|---|
| Cuenta | 25 USD **una vez** | **99 USD al año**, para siempre |
| Revisión | Horas, casi automática | Días, y **con persona revisando** |
| Rechazos | Raros | Habituales en la primera subida |
| Hace falta Mac | No | **No, con EAS** |

Los 99 USD son recurrentes: el día que se dejen de pagar, **la app
desaparece del App Store**, aunque lleve años publicada. Conviene que el
cliente lo sepa antes de decidir, porque es un gasto fijo que no termina.

---

## 2. Lo que hay que hacer

1. **Cuenta de Apple Developer** — 99 USD/año, a nombre del cliente, igual
   que Play Console. Si va como empresa, Apple pide además un número D-U-N-S,
   que puede tardar semanas en conseguirse. Como persona física es inmediato,
   pero entonces la app aparece publicada con su nombre real.
2. **Que inviten a Sebastián** como desarrollador. Igual que en Google, eso
   da acceso técnico y no al dinero.
3. **App Store Connect**: crear la ficha con el bundle `com.candelaia.app`,
   que ya está en `app.json`.
4. **Registrar iPhones de prueba** (`eas device:create`) para poder instalar
   builds internos antes de publicar.
5. `eas build --platform ios --profile preview`.
6. **TestFlight** para probar con gente real antes de la revisión.

---

## 3. Lo que ya está resuelto

- **El bundle identifier** (`com.candelaia.app`) coincide con el de Android.
- **El icono** vale tal cual: iOS lo quiere opaco y sin esquinas redondeadas
  —las pone el sistema—, y `logo-candela.png` es exactamente eso.
- **El permiso de fotos** ya lleva su texto explicativo. Sin él, Apple
  rechaza la app sin abrirla siquiera.
- **`ITSAppUsesNonExemptEncryption: false`**, que evita que App Store Connect
  pregunte por criptografía en cada subida.
- **Todo el diseño y la lógica**, que son el 95% del trabajo.

---

## 4. Donde esta app tiene más riesgo de rechazo

Apple revisa con criterio humano, así que conviene ir preparado. Por orden de
probabilidad:

**Contenido generado por IA (guía 1.2).** Apple exige que las apps con
contenido generado tengan filtros y una forma de reportar abusos. A favor
juega que el prompt ya prohíbe explícitamente lo vulgar y lo sexual y que
tiene una regla —la 7— que impide sugerir formas de insistir a alguien que
mostró desinterés. Eso no es adorno: es justo lo que un revisor busca.

**Categoría de citas (guía 1.1.4).** Las apps de ligar suelen pedir
verificación de edad. Es probable que haya que declararla como 17+.

**Suscripciones (guía 3.1.1).** El cobro tiene que ir por Apple IAP
obligatoriamente, y Apple se queda con su comisión igual que Google.
RevenueCat ya envuelve las dos tiendas, así que el trabajo es el mismo que
ya está planificado para Android.

**Privacidad (guía 5.1.1).** Hay que rellenar la "nutrition label" de datos.
Aquí la app parte con ventaja real: no guarda las capturas ni el texto de las
conversaciones, solo metadatos de uso. Se puede declarar con honestidad, y
eso se nota en la revisión.

**Que la app "no aporte valor suficiente" (guía 4.2).** El rechazo más
frustrante y el más común en apps sencillas. La defensa es que la ficha
enseñe bien qué hace: capturas reales de las cuatro funciones, no solo el
logo.

---

## 5. El orden recomendado

**Primero terminar Android del todo** —publicar, ver que las suscripciones
cobran, corregir lo que salga— y solo entonces ir a iOS.

Dos motivos: los 99 USD/año empiezan a correr desde que se abre la cuenta, y
cada problema que se arregle en Android llega a iOS ya resuelto. Abrir las dos
tiendas a la vez multiplica los frentes justo cuando aún no se sabe qué falla.

---

## 6. Lo que no se puede probar sin un iPhone

EAS construye sin Mac, pero **instalar y probar sí necesita un iPhone
físico**. No hace falta que sea de Sebastián: vale el del cliente, registrado
con `eas device:create`.

Y lo mismo que en Android: las compras y la valoración con estrellas solo
funcionan si la app viene de TestFlight o del App Store, nunca en una
instalación directa.
