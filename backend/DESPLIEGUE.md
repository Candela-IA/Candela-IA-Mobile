# Desplegar el backend en Railway

> Guía de una sola sentada. El repositorio ya trae todo lo que se puede
> automatizar (`railway.toml`, migraciones al arrancar, health check); lo que
> queda son los pasos del panel, que hay que hacer a mano una vez.

**Nunca pegues claves ni contraseñas en el chat.** Todos los secretos se
escriben directamente en el panel de Railway. Tampoco las dejes visibles en
una captura de pantalla: si pasa, la clave se considera comprometida y se
rota (crear una nueva, actualizar la variable, revocar la vieja).

> ✅ **Hecho el 25 de agosto de 2026.** El servicio vive en la cuenta del
> cliente, con MySQL en el mismo proyecto:
> **https://candela-ia-mobile-production.up.railway.app/api/v1**
>
> Esta guía queda para recrearlo desde cero, para el día que haya que montar
> un entorno de pruebas, y para cuando toque configurar RevenueCat (paso 7).

---

## 0. Antes de empezar: ¿de quién es la cuenta?

La infraestructura del proyecto va **a nombre del cliente y con su tarjeta**
—igual que OpenAI y las tiendas—, así que el proyecto de Railway debería
crearse en su cuenta desde el principio.

Si por tiempos lo levantas en la tuya, que sea a sabiendas: Railway cobra
$5/mes por el plan Hobby y el proyecto se puede transferir después
(*Project Settings → Transfer project*). Lo que no conviene es olvidarse y
terminar pagando la infraestructura de un encargo ajeno durante meses.

Vas a montar dos servicios dentro de un mismo proyecto:

```
Proyecto "Candela IA"
├── MySQL       ← base de datos gestionada
└── backend     ← este repositorio, carpeta backend/
```

---

## 1. Crear el proyecto y conectar el repositorio

> ⚠️ **Quién conecta el repositorio no da igual.** Railway solo lista los
> repositorios que ve la cuenta de GitHub conectada, y
> `Candela-IA/Candela-IA-Mobile` es privado. Si el cliente entra con su
> GitHub, le sale *"No repositories found"* — no es un fallo, es que ese
> repositorio no existe para su cuenta.
>
> Hay dos formas de resolverlo, y la diferencia es de negocio, no técnica:
>
> - **Que te inviten al proyecto de Railway** (*Settings → Members*). El
>   proyecto y la tarjeta siguen siendo del cliente; el repositorio lo
>   conectas tú con tu GitHub. Es lo que mantiene el reparto acordado sin
>   entregar el código todavía.
> - **Darle acceso al repositorio en GitHub.** Funciona, pero es entregar el
>   código fuente: decídelo a propósito, no por desbloquear un formulario.
>
> Lo que no conviene nunca es que el cliente suba un fork o una copia a su
> cuenta: quedan dos historiales y tus push dejan de llegar al servicio.

1. **New Project → Deploy from GitHub repo**.
2. La primera vez, Railway pide instalar su app de GitHub. Dale acceso solo
   a `Candela-IA/Candela-IA-Mobile` — no hace falta abrirle la cuenta entera.
   Si al abrir *Configure GitHub App* no aparece la organización
   `Candela-IA`, el problema no es de Railway: esa cuenta de GitHub no tiene
   acceso al repositorio.
3. Elige el repositorio. Railway crea un servicio y lanza un primer
   despliegue **que va a fallar**: todavía no sabe que el backend vive en una
   subcarpeta. Es normal, sigue.
4. En el servicio → **Settings → Source → Root Directory**, escribe:

   ```
   backend
   ```

Con eso Railway construye solo `backend/`, ignora `mobile/` y encuentra el
`railway.toml`, que ya trae el comando de construcción, el de arranque, el
health check y la política de reinicio.

> **De paso:** comprueba en esa misma pantalla que la rama observada sea
> `main`.

---

## 2. Añadir MySQL

En el proyecto: **New → Database → Add MySQL**.

Tarda unos segundos y queda listo. No hay que crear la base ni las tablas: de
eso se encarga `prisma migrate deploy` en cada arranque.

---

## 3. Las variables del backend

En el servicio del backend → pestaña **Variables**.

> ⚠️ Railway te recibe con una lista de **"Suggested Variables"** — *"We found
> these variables in your source code"*. Ha leído el `.env.example` y te
> propone **sus placeholders como valores**: `AI_PROVIDER=mock`,
> `OPENAI_API_KEY=sk-...` y un `DATABASE_URL` apuntando a `localhost`. No las
> aceptes tal cual; corrige los valores antes de pulsar *Add*.
>
> De esa lista, dos hay que **borrar** con la ✕: `npm_package_version` (la
> inyecta npm sola) y `API_URL` (es del móvil, el backend no la usa). Y dos
> vienen bien: los `${{ secret(...) }}` de `JWT_SECRET` y
> `REVENUECAT_WEBHOOK_SECRET` hacen que Railway genere valores aleatorios que
> nunca pasan por tu portapapeles — déjalos.
>
> **`NODE_ENV` no aparece entre las sugeridas.** Añádela a mano con
> *New Variable*, o el backend no se considerará en producción.

La forma rápida es *Raw Editor* y pegar todo junto:

```
DATABASE_URL=${{ MySQL.MYSQL_URL }}
NODE_ENV=production
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.6-luna
JWT_SECRET=
JWT_EXPIRES_IN=30d
SWAGGER=false
```

Detalle por detalle:

| Variable | Qué poner |
|---|---|
| `DATABASE_URL` | **Tal cual**, con las llaves. Es una referencia: Railway la sustituye por la URL real de MySQL y la mantiene al día si la base cambia de contraseña. Usa la red privada del proyecto, así que la base **no queda expuesta a internet** |
| `NODE_ENV` | `production` apaga Swagger y activa las comprobaciones estrictas del arranque |
| `AI_PROVIDER` | `openai`. Si alguien pone `mock`, el backend se niega a arrancar: servir frases enlatadas a gente que paga es peor que estar caído |
| `OPENAI_API_KEY` | La clave **de la cuenta del cliente**, pegada aquí y en ningún otro sitio |
| `OPENAI_MODEL` | `gpt-5.6-luna` |
| `JWT_SECRET` | Uno nuevo y aleatorio, **distinto al de tu `.env` local**. Genéralo con el comando de abajo y pégalo |
| `JWT_EXPIRES_IN` | `30d` |
| `SWAGGER` | **`true` en este despliegue, a propósito**, para que el cliente pueda verificar la API en `/api/docs`. El valor seguro por defecto es `false`: publicar la documentación completa facilita descubrir `POST /dispositivos/registrar` y quemar saldo de OpenAI inventando `deviceKey`. Se asume porque la cuenta es prepago y el daño está acotado al saldo. Ver la sección 8 del README |

Para el secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**`PORT` no se pone.** Railway la inyecta y `main.ts` la lee; escribirla a
mano es la forma clásica de que el health check no encuentre el servicio.

`REVENUECAT_WEBHOOK_SECRET` tampoco va todavía — ver el paso 7.

---

## 4. Darle una URL pública

Servicio del backend → **Settings → Networking → Generate Domain**.

Sale algo como `candela-ia-production-a1b2.up.railway.app`. Railway detecta
el puerto solo, porque la app escucha en `process.env.PORT` y en `0.0.0.0`.

---

## 5. Desplegar y mirar los logs

Con el Root Directory puesto, **Deploy**. En la pestaña de logs deberías ver,
en este orden:

```
Applying migration `20260813052756_inicial`
[Nest] Conectado a MySQL
[Nest] API      → http://localhost:8080/api/v1
```

La línea de la migración solo aparece la primera vez; después no hay nada
pendiente que aplicar y `migrate deploy` no dice nada.

Cuando el health check pase, el servicio se pone verde. Si se queda en
"Deploying" y acaba fallando, salta a las trampas del final.

---

## 6. Comprobar que está vivo

Cambia `URL` por tu dominio:

```bash
curl https://URL/api/v1/salud
```

```json
{"estado":"ok","baseDatos":"ok","version":"0.1.0","activoDesdeSegundos":42}
```

`baseDatos: "ok"` es la parte que importa: confirma que el backend habla con
MySQL, no solo que el proceso arrancó.

El catálogo, que es público y no gasta nada:

```bash
curl https://URL/api/v1/catalogo
```

Y el circuito completo —registrar un dispositivo de prueba y pedir su saldo—
sin tocar la app:

```bash
curl -X POST https://URL/api/v1/dispositivos/registrar -H "Content-Type: application/json" -d "{\"deviceKey\":\"prueba-despliegue-01\",\"plataforma\":\"ANDROID\",\"appVersion\":\"1.0.0\"}"
```

Devuelve un `token`. Con él:

```bash
curl https://URL/api/v1/dispositivos/saldo -H "Authorization: Bearer PEGA_EL_TOKEN"
```

Si sale `gratisRestantes: 5`, el backend está entero: base de datos,
migraciones, JWT y dominio.

> No dispares `POST /generar` contra producción salvo que quieras gastar. Son
> $0.0006 y sirve como prueba de humo, pero deja rastro en `generations` y en
> el saldo de ese dispositivo de prueba.

---

## 7. Después del despliegue

**Apuntar la app al backend.** En `mobile/.env` (cópialo de `.env.example`):

```
EXPO_PUBLIC_API_URL=https://URL/api/v1
```

Y arranca con `npx expo start --clear` — el `.env` se lee al construir el
bundle, así que sin limpiar caché el cambio no se aplica. Para volver a tu
laptop, basta con comentar la línea.

**El webhook de RevenueCat.** Cuando exista la cuenta del cliente:

1. Genera otro secreto aleatorio (el mismo comando del paso 3).
2. Ponlo en Railway como `REVENUECAT_WEBHOOK_SECRET`.
3. En el panel de RevenueCat, *Integrations → Webhooks*:
   - URL: `https://URL/api/v1/webhooks/revenuecat`
   - Authorization header: **exactamente el mismo valor**.

Mientras la variable esté vacía, el webhook rechaza todo con 401 y lo deja
escrito en los logs. Es a propósito: una URL que reparte suscripciones a
quien acierte el formato del JSON es peor que un webhook que no funciona.

---

## 8. Trampas

| Síntoma | Causa |
|---|---|
| El primer despliegue falla antes de instalar nada, y los logs listan `.vscode/ backend/ mobile/ README.md` | Falta el **Root Directory = `backend`**. Railway está intentando construir la raíz del repositorio, donde no hay `package.json` |
| El despliegue falla pero el desglose marca **Build ✓** y **Healthcheck ✗** | No es el build: el proceso arrancó y se murió por falta de variables. En *View logs → Deploy* estará nuestro `No puedo arrancar: el entorno está incompleto` diciendo cuáles |
| `/api/docs` responde con `SWAGGER=false` | Falta `NODE_ENV=production`. La condición del arranque es "si **no** es producción **o** SWAGGER=true", así que sin esa variable Swagger se publica aunque hayas puesto `SWAGGER=false`. (En este despliegue `/api/docs` responde porque `SWAGGER=true` está puesto a propósito — eso no es el fallo) |
| El botón *Generate Domain* está apagado | El `8080` del campo es un texto de sugerencia, no un valor. Hay que teclearlo |
| `No puedo arrancar: el entorno está incompleto` | Es nuestro propio aviso, y dice exactamente qué variable falta. Se arregla en Variables y se vuelve a desplegar |
| `prisma: not found` al arrancar | El CLI de Prisma tiene que estar en `dependencies`, no en `devDependencies`: el constructor poda las de desarrollo antes de arrancar. Ya está así, no lo muevas |
| No se puede alcanzar la base de datos | La referencia `${{ MySQL.MYSQL_URL }}` está mal escrita, o el servicio de MySQL se llama distinto. El nombre entre llaves es el del servicio en el panel |
| El health check nunca pasa, pero los logs se ven bien | Alguien puso `PORT` a mano. Bórrala: la inyecta Railway |
| La app del celular sigue hablando con la laptop | El `.env` de Expo se lee al construir el bundle → `npx expo start --clear` |
| `P3009: migrate found failed migrations` | Una migración se cortó a medias en un despliegue anterior. Se resuelve con `railway run npx prisma migrate resolve --rolled-back <nombre>` y volviendo a desplegar |

---

## 9. Qué cuesta esto

- **Railway Hobby**: $5/mes, que incluyen $5 de consumo. Un backend Node
  pequeño y una MySQL en reposo caben de sobra ahí.
- **OpenAI**: $0.0006 por generación (medido, no estimado). Mil generaciones
  son $0.60.

Las dos cuentas son del cliente. Conviene ponerle un **límite de gasto** a la
de OpenAI el mismo día que se conecta: es una clave dentro de un servicio
público, y un tope es la diferencia entre un susto y una factura.
