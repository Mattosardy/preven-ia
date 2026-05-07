# Preven-IA

Preven-IA es una web estatica y PWA instalable para detectar senales de riesgo antes de confiar en mensajes, enlaces, wallets, perfiles o propuestas sospechosas. Funciona offline con analisis local por reglas y esta preparada para sumar IA real online mediante un backend seguro.

## Seguridad importante

No pongas API keys en el frontend.

- No guardar claves en `app.js`.
- No guardar secretos en `index.html`.
- No subir credenciales a GitHub Pages.
- La IA real debe llamarse desde un backend seguro, por ejemplo Cloudflare Worker.

El frontend publico solo debe llamar a un endpoint como:

```js
const AI_ENDPOINT = "https://TU-WORKER.prevenia.workers.dev/analyze";
```

## Como ejecutar local con Live Server

1. Abri esta carpeta en VS Code.
2. Click derecho sobre `index.html`.
3. Elegi `Open with Live Server`.

Tambien podes abrir `index.html` directo, pero PWA/service worker funcionan mejor desde Live Server o una URL publicada.

## Modos del proyecto

### Modo web / PWA

- Sigue funcionando en GitHub Pages.
- Es mobile-first.
- Funciona offline con analisis local por reglas.
- Puede usar IA online mediante Worker si esta configurado.
- No incluye API keys en el frontend.

### Modo Android futuro

La carpeta `android-plan/` prepara una futura app Android basada en compartir texto o links con Preven-IA.

La v1 propuesta:

- Recibe texto desde el menu Compartir de Android.
- Analiza con motor local y opcionalmente IA online.
- No lee mensajes automaticamente.
- No accede directamente a WhatsApp ni otras apps.
- No usa overlay.
- No usa accessibility service.
- No pide permisos invasivos.

## Simular texto compartido en la web

Para probar el futuro flujo Android desde la web:

```text
index.html?sharedText=https%3A%2F%2Fejemplo.com
```

La app carga el texto en el campo, muestra el aviso "Texto recibido para analizar" y espera confirmacion del usuario. No analiza automaticamente.

## Como subir a GitHub Pages

1. Crea un repositorio, por ejemplo `preven-ia`.
2. Sube todos los archivos del proyecto, incluida la carpeta `icons/` y la carpeta `worker/`.
3. En GitHub entra a `Settings > Pages`.
4. En `Build and deployment`, elegi `Deploy from a branch`.
5. Selecciona la rama principal y carpeta `/root`.
6. Guarda y espera la URL publica.

URL esperada:

```text
https://USUARIO.github.io/preven-ia/
```

Cuando tengas la URL real, actualiza `sitemap.xml`.

## Rutas para GitHub Pages

El proyecto usa rutas relativas:

- `./styles.css`
- `./app.js`
- `./manifest.json`
- `./icons/icon-192.png`
- `./icons/icon-512.png`
- `./icons/preview.png`

## Como cambiar WhatsApp

En `app.js`:

```js
const WHATSAPP_NUMBER = "598XXXXXXXX";
```

Usa formato internacional sin `+`, espacios ni guiones. Si lo dejas vacio, la app mostrara que WhatsApp no esta configurado.

## Como cambiar datos de pago

En `app.js`:

```js
const PREX_ACCOUNT = "33909";
const PREX_OWNER = "Matias Arballo";
const PAYPAL_EMAIL = "matiast3@gmail.com";
const BTC_WALLET = "bc1q3scj8nh5ta300slstnjxn903wdt5d48wr0qqt5";
const PREMIUM_PACK_PRICE = "$99 UYU";
const HUMAN_REVIEW_PRICE = "$199 UYU";
```

## Como funciona el limite de verificaciones

Preven-IA usa `localStorage`, sin backend:

- 5 verificaciones gratis iniciales.
- Recupera 1 verificacion gratis cada 24 horas, hasta un maximo de 5.
- Se pueden desbloquear verificaciones con codigos locales.
- Si no quedan verificaciones, muestra opciones de pago/desbloqueo.

Clave local:

```js
const USAGE_STORAGE_KEY = "prevenia_usage_v1";
```

Esto es solo para MVP. El usuario puede borrar `localStorage`. Para control real se necesita backend.

## IA real mediante backend seguro

El frontend esta preparado con:

```js
const AI_ENABLED = true;
const AI_ENDPOINT = "https://TU-WORKER.prevenia.workers.dev/analyze";
const AI_TIMEOUT_MS = 12000;
```

Flujo:

1. Siempre ejecuta `analyzeRisk()` local.
2. Si hay internet y `AI_ENABLED` esta activo, llama al Worker.
3. Si la IA responde, muestra analisis hibrido.
4. Si falla, usa el resultado local como fallback.

La carpeta `worker/` incluye:

- `worker.js`
- `wrangler.toml.example`
- `README-WORKER.md`

Lee `worker/README-WORKER.md` para configurar OpenRouter con `OPENROUTER_API_KEY` como secret.

## Instalar como app

Android Chrome:

1. Abri la web publicada.
2. Toca `Instalar` si aparece.
3. Tambien podes usar `Agregar a pantalla principal`.

iPhone Safari:

1. Abri la web en Safari.
2. Toca `Compartir`.
3. Elegi `Agregar a pantalla de inicio`.

La app funciona offline despues de cargar una vez.

## Verificacion antes de publicar

- Probar `Analizar`.
- Probar input vacio y confirmar que no consume verificaciones.
- Probar fallback local con `AI_ENABLED = false`.
- Probar con endpoint IA real cuando el Worker este desplegado.
- Probar centro de pagos y WhatsApp.
- Probar copiar informe y compartir por WhatsApp.
- Probar PWA instalada.
- Probar offline despues de cargar una vez.
- Probar link de Telecom T3.

## Limitaciones actuales

- No hay base de datos.
- Historial, casos y verificaciones viven en `localStorage`.
- Los codigos locales no son seguridad real.
- El analisis es preventivo y orientativo.
- Para cobros y control real se recomienda backend.

## Documentacion Android

- `android-plan/README-ANDROID.md`
- `android-plan/PLAYSTORE-CHECKLIST.md`
- `android-plan/PRIVACY-DRAFT.md`
- `android-plan/TERMS-DRAFT.md`
- `android-plan/app-flow.md`
- `android-plan/share-target-flow.md`
- `android-plan/android-manifest-example.xml`
