# Preven-IA AI Worker

This Cloudflare Worker keeps the AI API key out of the public frontend. Never put API keys in `app.js`, `index.html`, GitHub Pages, or any public file.

## Setup

1. Install Wrangler:

```bash
npm install -g wrangler
```

2. Login to Cloudflare:

```bash
wrangler login
```

3. Copy the example config:

```bash
copy wrangler.toml.example wrangler.toml
```

4. Edit `wrangler.toml` and set your allowed origin:

```toml
ALLOWED_ORIGIN = "https://USUARIO.github.io"
```

For local tests, `http://127.0.0.1:5500` and `http://localhost:5500` are already allowed in `worker.js`.

5. Add the OpenRouter secret:

```bash
wrangler secret put OPENROUTER_API_KEY
```

6. Deploy:

```bash
wrangler deploy
```

7. Copy the Worker URL and paste it in `app.js`:

```js
const AI_ENDPOINT = "https://TU-WORKER.prevenia.workers.dev/analyze";
```

## Endpoint

`POST /analyze`

Expected body:

```json
{
  "text": "mensaje sospechoso",
  "localScore": 70,
  "localCategory": { "label": "Alto riesgo" },
  "localAlerts": ["alerta local"]
}
```

Expected response:

```json
{
  "ok": true,
  "aiSummary": "Resumen corto",
  "aiRiskLevel": "bajo",
  "aiDetectedPattern": "phishing",
  "aiRecommendedAction": "Recomendacion clara",
  "aiConfidence": "media"
}
```

## Change model

Default model:

```js
const MODEL = "openai/gpt-4o-mini";
```

You can also set `MODEL` as a Wrangler variable.

## Debugging

- Check Cloudflare Worker logs.
- Confirm `OPENROUTER_API_KEY` is configured as a secret.
- Confirm CORS origin matches your GitHub Pages domain.
- Test locally from Live Server before publishing.
