const MODEL = "openai/gpt-4o-mini";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_ALLOWED_ORIGINS = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://USUARIO.github.io"
];

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const configured = (env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowedOrigins = [...DEFAULT_ALLOWED_ORIGINS, ...configured];
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function jsonResponse(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request, env)
    }
  });
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found");
    return JSON.parse(match[0]);
  }
}

function validateAiPayload(payload) {
  const risk = ["bajo", "dudoso", "alto", "estafa_probable"];
  const patterns = ["phishing", "inversion_falsa", "soporte_falso", "crypto_scam", "sorteo_falso", "desconocido"];
  const confidence = ["baja", "media", "alta"];

  if (!risk.includes(payload.aiRiskLevel)) throw new Error("Invalid aiRiskLevel");
  if (!patterns.includes(payload.aiDetectedPattern)) throw new Error("Invalid aiDetectedPattern");
  if (!confidence.includes(payload.aiConfidence)) throw new Error("Invalid aiConfidence");

  return {
    ok: true,
    aiSummary: String(payload.aiSummary || "").slice(0, 180),
    aiRiskLevel: payload.aiRiskLevel,
    aiDetectedPattern: payload.aiDetectedPattern,
    aiRecommendedAction: String(payload.aiRecommendedAction || "").slice(0, 220),
    aiConfidence: payload.aiConfidence
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env)
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(request, env, { ok: false, error: "Method not allowed" }, 405);
    }

    if (!env.OPENROUTER_API_KEY) {
      return jsonResponse(request, env, { ok: false, error: "AI secret not configured" }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(request, env, { ok: false, error: "Invalid JSON" }, 400);
    }

    const text = String(body.text || "").trim();
    if (!text) {
      return jsonResponse(request, env, { ok: false, error: "text is required" }, 400);
    }

    if (text.length > 4000) {
      return jsonResponse(request, env, { ok: false, error: "text is too long" }, 400);
    }

    const systemPrompt = "Sos un analista preventivo de estafas digitales para usuarios de Uruguay y LATAM. Tu tarea es detectar señales de riesgo en mensajes, enlaces, propuestas de inversión, crypto, soporte falso, phishing bancario, sorteos falsos y pedidos de datos sensibles. No afirmes con certeza absoluta que algo es estafa salvo que el texto lo justifique. Respondé en JSON estricto, breve, claro y apto para personas mayores.";
    const userPrompt = [
      "Analizá este caso y devolvé solo JSON válido con esta forma exacta:",
      "{",
      '  "aiSummary": "máximo 180 caracteres",',
      '  "aiRiskLevel": "bajo|dudoso|alto|estafa_probable",',
      '  "aiDetectedPattern": "phishing|inversion_falsa|soporte_falso|crypto_scam|sorteo_falso|desconocido",',
      '  "aiRecommendedAction": "máximo 220 caracteres",',
      '  "aiConfidence": "baja|media|alta"',
      "}",
      "",
      `Texto del usuario: ${text}`,
      `Score local: ${body.localScore}`,
      `Categoría local: ${JSON.stringify(body.localCategory || {})}`,
      `Alertas locales: ${JSON.stringify(body.localAlerts || [])}`
    ].join("\n");

    const aiResponse = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://USUARIO.github.io/preven-ia/",
        "X-Title": "Preven-IA"
      },
      body: JSON.stringify({
        model: env.MODEL || MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!aiResponse.ok) {
      return jsonResponse(request, env, { ok: false, error: "AI provider error" }, 502);
    }

    try {
      const aiJson = await aiResponse.json();
      const content = aiJson.choices?.[0]?.message?.content;
      if (!content) throw new Error("Missing content");
      const parsed = extractJson(content);
      return jsonResponse(request, env, validateAiPayload(parsed));
    } catch {
      return jsonResponse(request, env, { ok: false, error: "Invalid AI JSON" }, 502);
    }
  }
};
