const inputEl = document.querySelector("#suspicious-input");
const analyzeBtn = document.querySelector("#analyze-btn");
const clearBtn = document.querySelector("#clear-btn");
const resultEl = document.querySelector("#result");
const scannerCard = document.querySelector(".scanner-card");
const scannerInputContent = document.querySelector("#scanner-input-content");
const scannerResult = document.querySelector("#scanner-result");
const historyListEl = document.querySelector("#history-list");
const clearHistoryBtn = document.querySelector("#clear-history-btn");
const demoButtons = document.querySelectorAll("[data-demo]");
const loadExampleBtn = document.querySelector("#load-example-btn");
const manualReviewLink = document.querySelector("#manual-review-link");
const caseForm = document.querySelector("#case-form");
const caseFormMessage = document.querySelector("#case-form-message");
const adminBtn = document.querySelector("#admin-btn");
const adminPanel = document.querySelector("#admin-panel");
const adminCasesList = document.querySelector("#admin-cases-list");
const exportCasesBtn = document.querySelector("#export-cases-btn");
const installCard = document.querySelector("#install-card");
const installBtn = document.querySelector("#install-btn");
const installCopy = document.querySelector("#install-copy");
const manualReviewMessage = document.querySelector("#manual-review-message");
const freeChecksCount = document.querySelector("#free-checks-count");
const resetUsageBtn = document.querySelector("#reset-usage-btn");
const sharedCard = document.querySelector("#shared-card");
const analyzeSharedBtn = document.querySelector("#analyze-shared-btn");
const androidNotifyBtn = document.querySelector("#android-notify-btn");
const shareSiteBtn = document.querySelector("#share-site-btn");
const shareSiteMessage = document.querySelector("#share-site-message");
const openWhatsappGuideBtn = document.querySelector("#open-whatsapp-guide-btn");
const openShareGuideBtn = document.querySelector("#open-share-guide-btn");
const whatsappGuideModal = document.querySelector("#whatsapp-guide-modal");
const whatsappGuideTitle = document.querySelector("#whatsapp-guide-title");
const guideImage = document.querySelector("#guide-image");
const guideImageLink = document.querySelector("#guide-image-link");
const guideImagePlaceholder = document.querySelector("#guide-image-placeholder");
const guideHelpText = document.querySelector("#guide-help-text");
const closeWhatsappGuideBtn = document.querySelector("#close-whatsapp-guide-btn");
const understoodWhatsappGuideBtn = document.querySelector("#understood-whatsapp-guide-btn");

const WHATSAPP_NUMBER = "598XXXXXXXX";
const BUSINESS_NAME = "Preven-IA";
const COUNTRY = "Uruguay / LATAM";
const CONTACT_EMAIL = "contacto@preven-ia.com";
const ADMIN_PIN = "1234";
const AI_ENABLED = true;
const AI_ENDPOINT = "https://TU-WORKER.prevenia.workers.dev/analyze";
const AI_TIMEOUT_MS = 12000;
const SOUND_ENABLED = false;
const RESULT_AUTO_RESET_MS = 15000;

const HISTORY_KEY = "nocaigas-risk-history-v2";
const CASES_KEY = "nocaigas-pending-cases-v1";
const USAGE_STORAGE_KEY = "prevenia_usage_v1";

let currentResult = null;
let deferredPrompt = null;
let resultResetTimer = null;

const demos = {
  crypto: "Hola! Última oportunidad para duplicá tu dinero en USDT. Depósito mínimo hoy y retiro pendiente en 24 hs. Soporte oficial Binance: https://bonus-binance-wallet-verify.xyz/login",
  bank: "Banco Seguridad: cuenta bloqueada urgente. Verificación obligatoria con usuario, contraseña, PIN, cédula, tarjeta y código SMS en http://login-santander-verify-uy.com",
  normal: "Sitio oficial de una tienda local: https://www.tiendaejemplo.com. Consulta sobre horarios, formas de pago y envío dentro de Uruguay."
};

const safetyChecklist = [
  "Verificá el dominio escribiéndolo manualmente o entrando desde la app oficial.",
  "Consultá a la empresa por un canal oficial antes de responder.",
  "Si hay dinero o crypto de por medio, pedí una segunda revisión."
];

const avoidChecklist = [
  "No compartas contraseñas, PIN, códigos SMS, CVV ni frases semilla.",
  "No transfieras dinero para desbloquear premios, retiros o cuentas.",
  "No instales apps ni entres a enlaces enviados por desconocidos."
];

function calculateCategory(score) {
  if (score <= 25) {
    return {
      label: "Bajo riesgo",
      level: "low",
      recommendation: "No se ven señales fuertes de estafa, pero verificá la fuente por canales oficiales."
    };
  }

  if (score <= 50) {
    return {
      label: "Dudoso",
      level: "doubt",
      recommendation: "Hay indicios para revisar. No avances hasta confirmar la identidad del sitio o contacto."
    };
  }

  if (score <= 75) {
    return {
      label: "Alto riesgo",
      level: "high",
      recommendation: "Evitá enviar dinero o datos. Guardá evidencia y consultá con una persona de confianza antes de seguir."
    };
  }

  return {
    label: "Estafa probable",
    level: "scam",
    recommendation: "No pagues, no compartas datos y cortá el contacto. Si ya avanzaste, contactá a tu banco o exchange."
  };
}

function analyzeRisk(input) {
  const original = input.trim();
  const normalizedText = normalizeText(original);
  const alerts = [];
  const patternHits = {
    phishing: 0,
    investment: 0,
    fakeSupport: 0,
    cryptoScam: 0,
    fakePrize: 0
  };
  let score = 0;

  const addAlert = (points, message, pattern) => {
    score += points;
    alerts.push(message);
    if (pattern) patternHits[pattern] += points;
  };

  if (!original) {
    const category = calculateCategory(0);
    return {
      score: 0,
      category,
      confidence: "Bajo",
      pattern: "Desconocido",
      alerts: ["No ingresaste contenido para analizar."],
      signals: ["No hay contenido suficiente para revisar."],
      explanation: "Pegá una URL, mensaje, wallet, perfil o propuesta para obtener un informe orientativo.",
      executiveSummary: `${BUSINESS_NAME} necesita contenido para emitir un diagnóstico.`,
      recommendation: "No compartas datos sensibles en el analizador.",
      shouldDo: ["Pegá el contenido sospechoso sin incluir claves ni datos bancarios."],
      shouldNotDo: avoidChecklist,
      analyzedAt: formatDateTime(new Date()),
      input: original
    };
  }

  if (original.length < 25) {
    addAlert(18, "El texto es demasiado corto para verificar con confianza.", "phishing");
  }

  const urls = original.match(/\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+|\b[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?/gi) || [];
  const domains = urls.map((url) => extractDomain(url.replace(/[),.;!?]+$/g, ""))).filter(Boolean);

  if (urls.length > 0) {
    addAlert(7, `Se detectaron ${urls.length} URL o dominio para revisar.`, "phishing");
  }

  const suspiciousDomainWords = ["login", "verify", "bonus", "reward", "withdraw", "wallet", "crypto", "investment", "soporte", "premio", "urgente"];
  const shorteners = ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "shorturl.at", "shorturl.com"];
  const brandWords = ["paypal", "mercado libre", "mercadolibre", "santander", "itau", "brou", "prex", "binance", "coinbase"];
  const rareTlds = ["xyz", "top", "click", "support", "live", "quest", "icu", "buzz", "work", "cam", "monster", "shop", "site"];

  urls.forEach((rawUrl) => {
    const cleanUrl = rawUrl.replace(/[),.;!?]+$/g, "");
    const domain = extractDomain(cleanUrl);
    const redirectFlags = detectRedirectPatterns(cleanUrl);
    const obfuscationFlags = detectObfuscation(cleanUrl);
    const trustedButAbused = domain && isTrustedHostingDomain(domain) && (redirectFlags.length > 0 || obfuscationFlags.length >= 2);

    redirectFlags.forEach((flag) => addAlert(flag.points, flag.message, "phishing"));
    obfuscationFlags.forEach((flag) => addAlert(flag.points, flag.message, "phishing"));

    if (trustedButAbused) {
      addAlert(
        35,
        `Dominio confiable usado de forma sospechosa (${domain}): combina hosting conocido con redirects, hashes o parametros ofuscados.`,
        "phishing"
      );
    }

    if (redirectFlags.length > 0 && obfuscationFlags.length > 0) {
      addAlert(
        28,
        "Detectamos patrones de redireccion y ofuscacion comunes en campanas de phishing.",
        "phishing"
      );
    }
  });

  domains.forEach((domain) => {
    const normalizedDomain = normalizeText(domain);

    if (shorteners.some((shortener) => normalizedDomain === shortener || normalizedDomain.endsWith(`.${shortener}`))) {
      addAlert(16, `El enlace usa un acortador (${domain}), lo que oculta el destino real.`, "phishing");
    }

    const domainWords = suspiciousDomainWords.filter((word) => normalizedDomain.includes(normalizeText(word)));
    if (domainWords.length > 0) {
      addAlert(18, `El dominio contiene palabras sensibles: ${domainWords.join(", ")}.`, "phishing");
    }

    const brandMatches = brandWords.filter((brand) => normalizedDomain.includes(normalizeText(brand).replace(/\s/g, "")));
    if (brandMatches.length > 0 && !looksLikeOfficialBrandDomain(normalizedDomain, brandMatches)) {
      addAlert(22, `El dominio parece imitar una marca conocida: ${brandMatches.join(", ")}.`, "phishing");
    }

    const hyphenCount = (domain.match(/-/g) || []).length;
    if (hyphenCount >= 2) {
      addAlert(12, "El dominio usa varios guiones, una técnica común para imitar sitios legítimos.", "phishing");
    }

    if (/\d{3,}/.test(domain) || /[a-z]+\d+[a-z]+/.test(domain)) {
      addAlert(10, "El dominio contiene números o combinaciones poco habituales.", "phishing");
    }

    const tld = domain.split(".").pop();
    if (rareTlds.includes(tld)) {
      addAlert(14, `El dominio usa un TLD poco común para servicios confiables: .${tld}.`, "phishing");
    }
  });

  if (urls.some((url) => url.toLowerCase().startsWith("http://"))) {
    addAlert(10, "Hay una URL con HTTP sin cifrado.", "phishing");
  }

  addKeywordAlert(
    normalizedText,
    ["bono", "premio", "regalo", "ganancia garantizada", "retiro pendiente", "verificacion obligatoria", "cuenta bloqueada", "soporte oficial", "inversion segura"],
    20,
    "Incluye palabras típicas de estafas o suplantación.",
    "fakePrize"
  );

  addKeywordAlert(
    normalizedText,
    ["usdt", "btc", "bitcoin", "ethereum", "wallet", "seed phrase", "frase semilla", "binance", "retiro", "deposito", "depósito"],
    18,
    "Incluye señales de posible estafa crypto o retiro falso.",
    "cryptoScam"
  );

  addKeywordAlert(
    normalizedText,
    ["urgente", "ultima oportunidad", "solo por hoy", "solo hoy", "activa ahora", "no pierdas", "ahora mismo", "24 hs"],
    17,
    "Usa presión emocional o urgencia para acelerar la decisión.",
    "phishing"
  );

  addKeywordAlert(
    normalizedText,
    ["contrasena", "contraseña", "clave", "pin", "codigo sms", "código sms", "tarjeta", "cvv", "cedula", "cédula", "documento", "frase semilla"],
    30,
    "Solicita datos sensibles o credenciales.",
    "phishing"
  );

  addKeywordAlert(
    normalizedText,
    ["duplicar", "duplica tu dinero", "duplicá tu dinero", "rentabilidad diaria", "sin riesgo", "gana mientras dormis", "ganá mientras dormís", "ganar dinero", "rentabilidad"],
    24,
    "Promete ganancias poco realistas o sin riesgo.",
    "investment"
  );

  addKeywordAlert(
    normalizedText,
    ["soporte", "soporte oficial", "verifica tu cuenta", "verifique su usuario", "bloqueo de cuenta", "cuenta bloqueada"],
    18,
    "Podría ser un intento de soporte falso o phishing de cuenta.",
    "fakeSupport"
  );

  const uppercaseLetters = original.replace(/[^A-ZÁÉÍÓÚÑ]/g, "").length;
  const letters = original.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "").length;
  if (letters > 30 && uppercaseLetters / letters > 0.42) {
    addAlert(9, "Tiene demasiadas mayúsculas, un patrón frecuente en mensajes agresivos o masivos.", "phishing");
  }

  const emojiMatches = original.match(/[\u{1F300}-\u{1FAFF}]/gu) || [];
  if (emojiMatches.length >= 4) {
    addAlert(7, "Usa emojis de forma exagerada para llamar la atención.", "fakePrize");
  }

  if (hasPoorStructure(original)) {
    addAlert(8, "La estructura del mensaje parece desordenada o poco profesional.", "phishing");
  }

  if (alerts.length === 0) {
    alerts.push("No se detectaron indicadores fuertes en las reglas básicas.");
  }

  score = Math.min(100, Math.max(0, score));
  const category = calculateCategory(score);
  const pattern = detectPattern(patternHits, score);
  const confidence = calculateConfidence(original, alerts, urls, score);
  const signals = buildSignals(alerts, domains, pattern);

  return {
    score,
    category,
    confidence,
    pattern,
    alerts,
    signals,
    explanation: buildExplanation(score, alerts, urls.length, pattern),
    executiveSummary: buildExecutiveSummary(score, category.label, pattern),
    recommendation: category.recommendation,
    shouldDo: buildShouldDo(score, pattern),
    shouldNotDo: buildShouldNotDo(pattern),
    analyzedAt: formatDateTime(new Date()),
    input: original
  };

  function addKeywordAlert(source, terms, points, message, pattern) {
    const matches = terms.filter((term) => source.includes(normalizeText(term)));
    if (matches.length > 0) {
      addAlert(points, `${message} Coincidencias: ${matches.slice(0, 5).join(", ")}.`, pattern);
    }
  }
}

function extractDomain(value) {
  try {
    const normalized = value.toLowerCase().startsWith("http") ? value : `https://${value}`;
    return new URL(normalized).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    const match = value.toLowerCase().match(/(?:www\.)?([a-z0-9-]+\.[a-z]{2,})/);
    return match ? match[1] : "";
  }
}

function detectRedirectPatterns(url) {
  const decoded = safeDecodeUrl(url);
  const normalized = normalizeText(decoded);
  const flags = [];

  const addFlag = (key, points, message) => {
    if (!flags.some((flag) => flag.key === key)) flags.push({ key, points, message });
  };

  if (/#\/?redirect/i.test(decoded) || /redirect\.html/i.test(decoded) || /\.html#\//i.test(decoded)) {
    addFlag("hash-redirect", 38, "Uso sospechoso de redirects dentro del hash o archivo HTML.");
  }

  if (/\bredirect\b|redirect_uri|returnurl|return_url/i.test(decoded)) {
    addFlag("redirect-word", 24, "La URL contiene terminos de redireccion usados frecuentemente en phishing.");
  }

  if (/[?&#](url|target|next|goto|continue|forward|dest|destination|redirect_uri|return|returnurl|return_url)=/i.test(decoded)) {
    addFlag("redirect-param", 30, "La URL incluye parametros que pueden redirigir a otro destino.");
  }

  if (/%3a%2f%2f|https?%3a%2f%2f|https?:\/\/.+https?:\/\//i.test(url) || /https?:\/\/.+https?:\/\//i.test(decoded)) {
    addFlag("encoded-chain", 34, "Detectamos una cadena de redireccion o URL codificada dentro de otra URL.");
  }

  if (normalized.includes("login") && (normalized.includes("continue") || normalized.includes("redirect") || normalized.includes("next"))) {
    addFlag("login-redirect", 28, "Combina login con redireccion, un patron comun de robo de credenciales.");
  }

  return flags;
}

function detectObfuscation(url) {
  const decoded = safeDecodeUrl(url);
  const flags = [];
  const addFlag = (key, points, message) => {
    if (!flags.some((flag) => flag.key === key)) flags.push({ key, points, message });
  };

  const compact = decoded.replace(/\s/g, "");
  const query = decoded.split("?")[1] || "";
  const hash = decoded.split("#")[1] || "";
  const symbolCount = (compact.match(/[._~%=&?#/:;,+-]/g) || []).length;
  const digitCount = (compact.match(/\d/g) || []).length;
  const encodedCount = (url.match(/%[0-9a-f]{2}/gi) || []).length;
  const separators = (compact.match(/[._~=&?#/:;,+-]/g) || []).length;
  const randomLikeTokens = compact.match(/[a-z]*_x\d{3,}|[a-z]{2,}_[a-z]{4,}|[a-z0-9]{18,}/gi) || [];

  if (decoded.length > 180) {
    addFlag("very-long-url", 24, "URL extremadamente larga.");
  }

  if (query.length > 140 || hash.length > 60) {
    addFlag("long-query-hash", 26, "Parametros u hash excesivamente largos.");
  }

  if (/#.{30,}/.test(decoded) || /#[^#]*(redirect|token|state|continue|next)/i.test(decoded)) {
    addFlag("suspicious-hash", 26, "Hash sospechoso o demasiado largo dentro de la URL.");
  }

  if (encodedCount >= 4 || /(?:%2f|%3d|%26|%23|%3f)/i.test(url)) {
    addFlag("encoded-payload", 24, "La URL contiene payloads codificados u ocultos.");
  }

  if (symbolCount > 22 || separators > 26) {
    addFlag("many-separators", 18, "Demasiados simbolos o separadores en la URL.");
  }

  if (digitCount >= 18 || randomLikeTokens.length >= 2) {
    addFlag("random-tokens", 24, "Parametros ofuscados o tokens aleatorios detectados.");
  }

  if (/\b(_x\d{3,}|vl_fresh|token|tokens|state|session|payload|callback|tracking|utm_|fbclid|gclid)\b/i.test(decoded)) {
    addFlag("tracking-token", 22, "Tokens, tracking o subcadenas sospechosas en la URL.");
  }

  if (calculateEntropy(compact) > 4.35 && compact.length > 90) {
    addFlag("high-entropy", 22, "La URL tiene entropia alta, compatible con ofuscacion.");
  }

  return flags;
}

function safeDecodeUrl(value) {
  let decoded = String(value || "");
  for (let index = 0; index < 2; index += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function calculateEntropy(value) {
  if (!value) return 0;
  const counts = {};
  for (const char of value) counts[char] = (counts[char] || 0) + 1;
  return Object.values(counts).reduce((sum, count) => {
    const probability = count / value.length;
    return sum - (probability * Math.log2(probability));
  }, 0);
}

function isTrustedHostingDomain(domain) {
  const normalizedDomain = normalizeText(domain);
  const trustedDomains = [
    "googleapis.com",
    "storage.googleapis.com",
    "firebaseapp.com",
    "web.app",
    "github.io",
    "cloudflare.com",
    "workers.dev",
    "pages.dev",
    "drive.google.com",
    "docs.google.com"
  ];

  return trustedDomains.some((trustedDomain) => (
    normalizedDomain === trustedDomain || normalizedDomain.endsWith(`.${trustedDomain}`)
  ));
}

function normalizeText(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function looksLikeOfficialBrandDomain(domain, brands) {
  return brands.some((brand) => {
    const compactBrand = normalizeText(brand).replace(/\s/g, "");
    return domain === `${compactBrand}.com` || domain === `${compactBrand}.com.uy` || domain === `${compactBrand}.uy`;
  });
}

function hasPoorStructure(text) {
  const repeatedPunctuation = /[!?]{3,}/.test(text);
  const manyLineBreaks = (text.match(/\n/g) || []).length > 8;
  const veryLongNoSpaces = /\S{45,}/.test(text);
  return repeatedPunctuation || manyLineBreaks || veryLongNoSpaces;
}

function calculateConfidence(input, alerts, urls, score) {
  if (input.length < 25) return "Bajo";
  if (score >= 70 || alerts.length >= 5 || urls.length >= 2) return "Alto";
  if (score >= 30 || alerts.length >= 3 || input.length > 90) return "Medio";
  return "Bajo";
}

function detectPattern(patternHits, score) {
  if (score <= 25) return "Desconocido";

  const labels = {
    phishing: "Phishing",
    investment: "Inversión falsa",
    fakeSupport: "Soporte falso",
    cryptoScam: "Crypto scam",
    fakePrize: "Sorteo falso"
  };

  const topPattern = Object.entries(patternHits).sort((a, b) => b[1] - a[1])[0];
  return topPattern && topPattern[1] > 0 ? labels[topPattern[0]] : "Desconocido";
}

function buildSignals(alerts, domains, pattern) {
  const signals = alerts.slice(0, 6);

  if (domains.length > 0) {
    signals.unshift(`Dominio(s) revisado(s): ${domains.slice(0, 3).join(", ")}.`);
  }

  if (pattern !== "Desconocido") {
    signals.unshift(`Patrón probable detectado: ${pattern}.`);
  }

  return signals.slice(0, 7);
}

function buildExplanation(score, alerts, urlCount, pattern) {
  const count = alerts.length;
  const hasModernPhishingPattern = alerts.some((alert) => normalizeText(alert).includes("redireccion y ofuscacion"));
  if (hasModernPhishingPattern) {
    return "Detectamos patrones de redirección y ofuscación comunes en campañas de phishing.";
  }

  if (score === 0) {
    return "El sistema no pudo evaluar riesgo porque no recibió contenido.";
  }

  if (score <= 25) {
    return `El riesgo subió poco porque solo aparecieron ${count} señal(es) leve(s). Aun así, verificá la fuente antes de confiar.`;
  }

  if (score <= 50) {
    return `El riesgo subió porque el contenido combina ${count} señal(es) sospechosa(s)${urlCount ? ` y ${urlCount} enlace(s)` : ""}. El patrón más cercano es: ${pattern}.`;
  }

  if (score <= 75) {
    return `El riesgo subió fuerte porque aparecen señales asociadas a robo de datos, presión para actuar o promesas de dinero. El patrón probable es: ${pattern}.`;
  }

  return `El riesgo es crítico porque se acumulan señales típicas de estafa: enlaces dudosos, urgencia, datos sensibles o promesas irreales. Patrón probable: ${pattern}.`;
}

function buildExecutiveSummary(score, category, pattern) {
  if (score <= 25) {
    return `Resumen: riesgo ${category.toLowerCase()}, sin señales críticas por las reglas actuales.`;
  }

  if (score <= 50) {
    return "Resumen: caso dudoso con señales que conviene validar antes de responder o pagar.";
  }

  if (score <= 75) {
    return `Resumen: alto riesgo compatible con ${pattern.toLowerCase()}; no avances sin revisión.`;
  }

  return `Resumen: estafa probable compatible con ${pattern.toLowerCase()}; cortá el contacto y no compartas datos.`;
}

function buildShouldDo(score, pattern) {
  if (score <= 25) return safetyChecklist;

  const actions = [
    "Guardá capturas, enlaces, usuario, wallet o número de teléfono como evidencia.",
    "Verificá la identidad por una app oficial, web oficial o teléfono publicado por la empresa.",
    "Consultá con una persona de confianza antes de transferir dinero, invertir en crypto o entregar datos."
  ];

  if (pattern === "Crypto scam") {
    actions.unshift("Revisá la wallet, exchange y promesa de retiro antes de hacer cualquier depósito.");
  }

  if (pattern === "Phishing") {
    actions.unshift("Cambiá contraseñas desde la web oficial si llegaste a ingresar datos.");
  }

  return actions;
}

function buildShouldNotDo(pattern) {
  const items = [...avoidChecklist];

  if (pattern === "Crypto scam" || pattern === "Inversión falsa") {
    items.unshift("No hagas depósitos para liberar retiros, bonos o ganancias.");
  }

  if (pattern === "Phishing" || pattern === "Soporte falso") {
    items.unshift("No ingreses a enlaces recibidos por mensaje para verificar cuentas.");
  }

  return items.slice(0, 5);
}

async function analyzeWithAI(userInput, localResult) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: userInput,
        localScore: localResult.score,
        localCategory: localResult.category,
        localAlerts: localResult.alerts
      }),
      signal: controller.signal
    });

    if (!response.ok) throw new Error("AI endpoint error");

    const data = await response.json();
    if (!data || data.ok !== true) throw new Error("Invalid AI response");

    const allowedRisk = ["bajo", "dudoso", "alto", "estafa_probable"];
    const allowedPattern = ["phishing", "inversion_falsa", "soporte_falso", "crypto_scam", "sorteo_falso", "desconocido"];
    const allowedConfidence = ["baja", "media", "alta"];

    if (!allowedRisk.includes(data.aiRiskLevel) || !allowedPattern.includes(data.aiDetectedPattern) || !allowedConfidence.includes(data.aiConfidence)) {
      throw new Error("AI response out of schema");
    }

    return {
      ok: true,
      aiSummary: String(data.aiSummary || "").slice(0, 220),
      aiRiskLevel: data.aiRiskLevel,
      aiDetectedPattern: data.aiDetectedPattern,
      aiRecommendedAction: String(data.aiRecommendedAction || "").slice(0, 260),
      aiConfidence: data.aiConfidence
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function buildHybridResult(input, localResult) {
  if (!AI_ENABLED || !AI_ENDPOINT || AI_ENDPOINT.includes("TU-WORKER") || !navigator.onLine) {
    return {
      ...localResult,
      ai: null,
      aiFallbackMessage: "Análisis local aplicado. La revisión online no está disponible ahora."
    };
  }

  try {
    const ai = await analyzeWithAI(input, localResult);
    return {
      ...localResult,
      ai,
      aiFallbackMessage: ""
    };
  } catch {
    return {
      ...localResult,
      ai: null,
      aiFallbackMessage: "Análisis local aplicado. La revisión online no está disponible ahora."
    };
  }
}

function getTrafficLightResult(result) {
  if (result.score <= 25) {
    return {
      level: "green",
      title: "ABRIR",
      subtitle: "No detectamos señales fuertes de estafa.",
      icon: "✓"
    };
  }

  if (result.score <= 60) {
    return {
      level: "yellow",
      title: "CUIDADO",
      subtitle: "Hay señales sospechosas. Verificá antes de continuar.",
      icon: "!"
    };
  }

  return {
    level: "red",
    title: "PELIGRO",
    subtitle: "Detectamos múltiples señales comunes de estafa.",
    icon: "✕"
  };
}

function playResultSound(level) {
  if (!SOUND_ENABLED || !window.AudioContext) return;

  const audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.frequency.value = level === "green" ? 660 : level === "yellow" ? 440 : 220;
  gain.gain.value = 0.04;
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.12);
}

function clearResultResetTimer() {
  if (!resultResetTimer) return;
  clearTimeout(resultResetTimer);
  resultResetTimer = null;
}

function showSearchMode({ focus = false } = {}) {
  clearResultResetTimer();
  if (scannerInputContent) scannerInputContent.hidden = false;
  if (scannerResult) {
    scannerResult.hidden = true;
    scannerResult.innerHTML = "";
  }
  if (scannerCard) scannerCard.classList.remove("result-mode");
  if (resultEl) resultEl.hidden = true;
  if (focus) inputEl.focus();
}

function scheduleResultAutoReset() {
  clearResultResetTimer();
  resultResetTimer = setTimeout(() => {
    inputEl.value = "";
    currentResult = null;
    showSearchMode();
    updateManualReviewLink();
  }, RESULT_AUTO_RESET_MS);
}

function renderResult(result) {
  const { score, category, confidence, pattern, alerts, signals, explanation, recommendation, analyzedAt, executiveSummary } = result;
  const traffic = getTrafficLightResult(result);
  const aiApplied = Boolean(result.ai && result.ai.ok);
  const aiStatusText = aiApplied ? "Revisión online aplicada" : "Análisis local";
  const aiFallbackText = result.aiFallbackMessage || "";
  const aiDetails = aiApplied ? `
          <section class="report-box wide ai-box">
            <h3>Análisis híbrido</h3>
            <p>${escapeHtml(result.ai.aiSummary)}</p>
            <ul class="ai-list">
              <li><strong>Nivel IA:</strong> ${escapeHtml(result.ai.aiRiskLevel)}</li>
              <li><strong>Patrón IA:</strong> ${escapeHtml(result.ai.aiDetectedPattern)}</li>
              <li><strong>Confianza IA:</strong> ${escapeHtml(result.ai.aiConfidence)}</li>
              <li><strong>Acción sugerida:</strong> ${escapeHtml(result.ai.aiRecommendedAction)}</li>
            </ul>
          </section>
  ` : "";

  if (scannerInputContent) scannerInputContent.hidden = true;
  if (scannerCard) scannerCard.classList.add("result-mode");
  if (scannerResult) scannerResult.hidden = false;
  if (resultEl) resultEl.hidden = true;

  const targetEl = scannerResult || resultEl;
  targetEl.className = "scanner-result";
  targetEl.innerHTML = `
    <article class="report traffic-report traffic-${traffic.level}">
      <header class="traffic-header">
        <div class="traffic-icon" aria-hidden="true">${traffic.icon}</div>
        <button class="traffic-decision" type="button" disabled>${traffic.title}</button>
        <p>${traffic.subtitle}</p>
        <span class="traffic-badge">${escapeHtml(aiStatusText)}</span>
      </header>

      <details class="report-details">
        <summary>Ver detalles</summary>
        <div class="report-grid">
          ${aiDetails}
          <section class="report-box wide">
            <h3>Alertas detectadas</h3>
            <ul class="alert-list">
              ${alerts.slice(0, 8).map((alert) => `<li class="risk-${category.level}">${escapeHtml(alert)}</li>`).join("")}
            </ul>
          </section>

          <section class="report-box wide">
            <h3>Qué señales encontramos</h3>
            <ul class="alert-list">
              ${signals.map((signal) => `<li class="risk-${category.level}">${escapeHtml(signal)}</li>`).join("")}
            </ul>
          </section>

          <section class="report-box">
            <h3>Explicación</h3>
            <p>${escapeHtml(explanation)}</p>
            <p class="mini-note">Confianza: ${escapeHtml(confidence)} · Patrón: ${escapeHtml(pattern)} · ${escapeHtml(analyzedAt)}</p>
          </section>

          <section class="report-box">
            <h3>Recomendación</h3>
            <p>${escapeHtml(recommendation)}</p>
            <p class="mini-note">Categoría interna: ${escapeHtml(category.label)}</p>
          </section>

          <section class="report-box">
            <h3>Qué deberías hacer</h3>
            <ul class="action-list">
              ${result.shouldDo.map((item) => `<li class="risk-${category.level}">${escapeHtml(item)}</li>`).join("")}
            </ul>
          </section>

          <section class="report-box">
            <h3>Qué NO deberías hacer</h3>
            <ul class="action-list avoid-list">
              ${result.shouldNotDo.map((item) => `<li class="risk-scam">${escapeHtml(item)}</li>`).join("")}
            </ul>
          </section>

          <section class="report-box">
            <h3>Checklist de seguridad</h3>
            <ul class="safety-checklist">
              <li>Verificá el dominio oficial.</li>
              <li>No pagues para liberar premios o retiros.</li>
              <li>No compartas claves ni códigos.</li>
              <li>Contactá por canales oficiales.</li>
            </ul>
          </section>
        </div>

        <div class="result-actions">
          <button class="btn btn-secondary" type="button" id="copy-result-btn">Copiar informe</button>
          <button class="btn btn-secondary" type="button" id="share-result-btn">Compartir resultado</button>
        </div>
      </details>
      <p class="result-reset-note">La pantalla vuelve al buscador en 15 segundos.</p>
    </article>
  `;

  targetEl.querySelector("#copy-result-btn").addEventListener("click", () => copyResult(result));
  targetEl.querySelector("#share-result-btn").addEventListener("click", () => shareResult(result));
  scheduleResultAutoReset();
  playResultSound(traffic.level);
}

function saveHistory(result) {
  if (!result.input) return;

  const history = getHistory();
  const item = {
    summary: createSummary(result.input),
    date: result.analyzedAt,
    score: result.score,
    category: result.category.label,
    level: result.category.level,
    decision: getTrafficLightResult(result).title
  };

  history.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}

function renderHistory() {
  const history = getHistory();

  if (history.length === 0) {
    historyListEl.innerHTML = `<p class="subtitle">Todavía no hay análisis guardados.</p>`;
    return;
  }

  historyListEl.innerHTML = history.map((item) => `
    <article class="history-item">
      <div class="history-meta">
        <span>${escapeHtml(item.date)}</span>
        <strong class="risk-${item.level}">${escapeHtml(item.decision || item.category)}</strong>
      </div>
      <p class="history-summary">${escapeHtml(item.summary)}</p>
    </article>
  `).join("");
}

function clearForm() {
  inputEl.value = "";
  currentResult = null;
  showSearchMode({ focus: true });
  updateManualReviewLink();
}

function getHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getCases() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CASES_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCases(cases) {
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
}

// Este sistema es para MVP. localStorage puede ser borrado por el usuario. Para control real se necesitará backend.
function createDefaultUsage() {
  return {
    lastRecoveryAt: Date.now(),
    totalChecksUsed: 0
  };
}

function getUsage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY));
    if (!parsed || typeof parsed !== "object") return createDefaultUsage();
    return {
      ...createDefaultUsage(),
      ...parsed
    };
  } catch {
    return createDefaultUsage();
  }
}

function saveUsage(usage) {
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
}

function recoverFreeChecksIfNeeded() {
  const usage = getUsage();
  if (!usage.lastRecoveryAt) {
    usage.lastRecoveryAt = Date.now();
    saveUsage(usage);
  }

  updateUsageDisplay(usage);
  return usage;
}

function updateUsageDisplay(usage = getUsage()) {
  if (freeChecksCount) freeChecksCount.textContent = "sin límite";
}

function consumeVerification() {
  const usage = getUsage();

  usage.totalChecksUsed += 1;
  saveUsage(usage);
  updateUsageDisplay(usage);
  return true;
}

function createSummary(text) {
  const clean = redactSensitiveText(text.replace(/\s+/g, " ").trim());
  return clean.slice(0, 96) + (clean.length > 96 ? "..." : "");
}

function redactSensitiveText(text) {
  return text
    .replace(/\b\d{3,4}\s?\d{3,4}\s?\d{3,4}\s?\d{0,4}\b/g, "[número oculto]")
    .replace(/\b(cvv|pin|clave|contraseña|contrasena|seed phrase|frase semilla|codigo sms|código sms)\b[^.,;\n]*/gi, "[dato sensible oculto]");
}

function handleCaseSubmit(event) {
  event.preventDefault();

  const formData = new FormData(caseForm);
  const name = String(formData.get("name") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const detail = String(formData.get("detail") || "").trim();
  const consent = formData.get("consent") === "on";

  if (!name || !contact || !type || !consent) {
    showCaseMessage("Completá nombre/alias, contacto, tipo de caso y aceptación.", "error");
    return;
  }

  if (containsSensitiveTerms(detail)) {
    showCaseMessage("Quitá claves, PIN, códigos SMS, CVV o frases semilla antes de guardar el caso.", "error");
    return;
  }

  const analysis = currentResult || analyzeRisk(inputEl.value);
  const caseItem = {
    id: `case-${Date.now()}`,
    status: "pending",
    date: formatDateTime(new Date()),
    name: createSummary(name),
    contact: createSummary(contact),
    type,
    score: analysis.input ? analysis.score : "Sin análisis",
    category: analysis.input ? analysis.category.label : "Sin análisis",
    level: analysis.input ? analysis.category.level : "doubt",
    summary: createSummary(inputEl.value || detail || type),
    detailSummary: createSummary(detail || "Sin detalle adicional"),
    country: COUNTRY
  };

  const cases = getCases();
  cases.unshift(caseItem);
  saveCases(cases);
  caseForm.reset();
  showCaseMessage("Caso guardado como pendiente. La revisión manual está gratis por ahora.", "success");
  renderAdminCases();
}

function containsSensitiveTerms(text) {
  return /\b(contraseña|contrasena|clave|pin|codigo sms|código sms|cvv|frase semilla|seed phrase|seed|private key|llave privada)\b/i.test(text);
}

function showCaseMessage(message, type) {
  if (!caseFormMessage) return;
  caseFormMessage.textContent = message;
  caseFormMessage.className = `form-message ${type}`;
}

function openAdmin() {
  const pin = window.prompt("PIN de admin");
  if (pin !== ADMIN_PIN) return;

  adminPanel.hidden = false;
  renderAdminCases();
  adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderAdminCases() {
  const pendingCases = getCases().filter((item) => item.status === "pending");

  if (pendingCases.length === 0) {
    adminCasesList.innerHTML = `<p class="subtitle">No hay casos pendientes.</p>`;
    return;
  }

  adminCasesList.innerHTML = pendingCases.map((item) => `
    <article class="admin-case">
      <div class="admin-case-main">
        <div class="history-meta">
          <span>${escapeHtml(item.date)}</span>
          <strong class="risk-${item.level}">${escapeHtml(String(item.score))}${typeof item.score === "number" ? "/100" : ""} · ${escapeHtml(item.category)}</strong>
        </div>
        <h3>${escapeHtml(item.type)}</h3>
        <p><strong>Contacto:</strong> ${escapeHtml(item.contact)} · <strong>Alias:</strong> ${escapeHtml(item.name)}</p>
        <p><strong>Resumen:</strong> ${escapeHtml(item.summary)}</p>
        <p><strong>Detalle:</strong> ${escapeHtml(item.detailSummary)}</p>
      </div>
      <div class="admin-case-actions">
        <button class="btn btn-secondary" type="button" data-review="${escapeHtml(item.id)}">Marcar como revisado</button>
        <button class="btn btn-ghost" type="button" data-delete="${escapeHtml(item.id)}">Borrar caso</button>
      </div>
    </article>
  `).join("");
}

function updateCaseStatus(id, status) {
  const cases = getCases().map((item) => item.id === id ? { ...item, status, reviewedAt: formatDateTime(new Date()) } : item);
  saveCases(cases);
  renderAdminCases();
}

function deleteCase(id) {
  const cases = getCases().filter((item) => item.id !== id);
  saveCases(cases);
  renderAdminCases();
}

function exportCases() {
  const data = JSON.stringify(getCases(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `prevenia-casos-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function copyResult(result) {
  const text = formatResultText(result);

  copyToClipboard(text).then(() => {
    flashButton("#copy-result-btn", "Informe copiado");
  });
}

function shareResult(result) {
  const text = [
    "Análisis orientativo realizado con Preven-IA.",
    `Categoría: ${result.category.label}`,
    `Puntaje: ${result.score}/100`,
    `Recomendación: ${result.recommendation}`
  ].join("\n");

  shareOrCopy({
    title: "Preven-IA",
    text,
    url: window.location.href
  }, "#share-result-btn", "Resultado copiado para compartir.");
}

function shareSite() {
  shareOrCopy({
    title: "Preven-IA",
    text: "Prevenir una estafa solo tarda 1 minuto. Probá Preven-IA antes de abrir enlaces o pasar datos.",
    url: window.location.href
  }, null, "Link copiado para compartir.");
}

async function shareOrCopy(payload, buttonSelector, fallbackMessage) {
  const textToCopy = `${payload.title}\n${payload.text}\n${payload.url}`;

  try {
    if (navigator.share) {
      await navigator.share(payload);
      return;
    }

    await copyToClipboard(textToCopy);
    if (buttonSelector) {
      flashButton(buttonSelector, fallbackMessage);
    } else if (shareSiteMessage) {
      shareSiteMessage.textContent = fallbackMessage;
      shareSiteMessage.className = "form-message success share-message";
    }
  } catch {
    await copyToClipboard(textToCopy);
    if (buttonSelector) {
      flashButton(buttonSelector, fallbackMessage);
    } else if (shareSiteMessage) {
      shareSiteMessage.textContent = fallbackMessage;
      shareSiteMessage.className = "form-message success share-message";
    }
  }
}

function formatResultText(result) {
  const lines = [
    `${BUSINESS_NAME} - Informe orientativo`,
    `País/región: ${COUNTRY}`,
    `Fecha: ${result.analyzedAt}`,
    `Puntaje: ${result.score}/100`,
    `Categoría: ${result.category.label}`,
    `Confianza: ${result.confidence}`,
    `Patrón probable: ${result.pattern}`,
    `Resumen: ${result.executiveSummary}`,
    `Alertas principales: ${result.alerts.slice(0, 5).join(" | ")}`,
    `Recomendación: ${result.recommendation}`,
    `Contacto: ${CONTACT_EMAIL}`,
    "Aviso: este análisis es orientativo y no reemplaza una investigación profesional."
  ];

  if (result.ai && result.ai.ok) {
    lines.splice(8, 0, `IA online: ${result.ai.aiSummary}`, `Acción IA: ${result.ai.aiRecommendedAction}`);
  }

  return lines.join("\n");
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
}

function flashButton(selector, label) {
  const button = document.querySelector(selector);
  if (!button) return;

  const original = button.textContent;
  button.textContent = label;
  setTimeout(() => {
    button.textContent = original;
  }, 1500);
}

function buildManualReviewUrl(result = currentResult) {
  if (!isWhatsAppConfigured()) return "#";

  const summary = result && result.input ? createSummary(result.input) : createSummary(inputEl.value || "Todavía no agregué el detalle.");
  const score = result && result.input ? result.score : "sin puntaje";
  const category = result && result.input ? result.category.label : "sin categoría";
  const text = `Hola, quiero una revisión manual de posible estafa. Ya hice el análisis en ${BUSINESS_NAME}. Mi caso es: ${summary}. Puntaje: ${score}. Categoría: ${category}.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function buildAndroidNotifyUrl() {
  if (!isWhatsAppConfigured()) return "";
  const text = "Hola, quiero que me avisen cuando esté disponible Preven-IA para Android.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function isWhatsAppConfigured() {
  return /^\d{8,15}$/.test(WHATSAPP_NUMBER);
}

function loadSharedTextFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const sharedText = params.get("sharedText");
  if (!sharedText) return;

  inputEl.value = sharedText.slice(0, 4000);
  updateManualReviewLink();

  if (sharedCard) {
    sharedCard.hidden = false;
    sharedCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function showManualReviewMessage(message, type = "success") {
  if (!manualReviewMessage) return;
  manualReviewMessage.textContent = message;
  manualReviewMessage.className = `form-message ${type}`;
}

function updateManualReviewLink() {
  if (!manualReviewLink) return;
  manualReviewLink.href = buildManualReviewUrl(currentResult);
}

function openGuideModal({ title, imageSrc, imageAlt, helpText }) {
  if (!whatsappGuideModal) return;
  if (whatsappGuideTitle) whatsappGuideTitle.textContent = title;
  if (guideImage) {
    guideImage.hidden = false;
    guideImage.src = imageSrc;
    guideImage.alt = imageAlt;
  }
  if (guideImageLink) guideImageLink.href = imageSrc;
  if (guideImagePlaceholder) guideImagePlaceholder.hidden = true;
  if (guideHelpText) guideHelpText.textContent = helpText;
  whatsappGuideModal.hidden = false;
  document.body.classList.add("modal-open");
  if (understoodWhatsappGuideBtn) understoodWhatsappGuideBtn.focus();
}

function openWhatsappGuide() {
  openGuideModal({
    title: "Cómo copiar un link en WhatsApp",
    imageSrc: "./assets/tutoriales/copiar-link.png",
    imageAlt: "Guía visual para copiar un link en WhatsApp y pegarlo en Preven-IA",
    helpText: "Si no podés copiarlo, pedile ayuda a un familiar de confianza."
  });
}

function openShareGuide() {
  openGuideModal({
    title: "Cómo compartir Preven-IA por WhatsApp",
    imageSrc: "./assets/tutoriales/compartir-prevenia.png",
    imageAlt: "Guía visual para compartir Preven-IA por WhatsApp",
    helpText: "Compartir Preven-IA puede ayudar a otra persona a revisar un mensaje antes de confiar."
  });
}

function closeWhatsappGuide() {
  if (!whatsappGuideModal) return;
  whatsappGuideModal.hidden = true;
  document.body.classList.remove("modal-open");
  if (openWhatsappGuideBtn) openWhatsappGuideBtn.focus();
}

function formatDateTime(date) {
  return date.toLocaleString("es-UY", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // La app debe seguir funcionando aunque el navegador no permita registrar el service worker.
    });
  });
}

function isIosSafari() {
  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isStandalone = window.navigator.standalone === true;
  return isIos && !isStandalone;
}

function setupInstallPrompt() {
  if (!installCard || !installBtn || !installCopy) return;

  if (window.matchMedia("(display-mode: standalone)").matches) {
    installCard.hidden = true;
    installBtn.hidden = true;
    return;
  }

  if (isIosSafari()) {
    installCard.hidden = false;
    installBtn.hidden = true;
    installCopy.textContent = "En iPhone: tocá Compartir y luego “Agregar a pantalla de inicio”.";
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    // Keep the browser prompt for our explicit, user-triggered install button.
    event.preventDefault();
    deferredPrompt = event;
    installCard.hidden = false;
    installBtn.hidden = false;
    installCopy.textContent = "Agregala a la pantalla principal para usarla como app.";
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    installBtn.disabled = true;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.disabled = false;
    installBtn.hidden = true;
    installCard.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installBtn.hidden = true;
    installCard.hidden = true;
  });
}

analyzeBtn.addEventListener("click", async () => {
  const input = inputEl.value.trim();
  const localResult = analyzeRisk(inputEl.value);

  if (!input) {
    currentResult = null;
    showSearchMode();
    updateManualReviewLink();
    return;
  }

  if (!consumeVerification()) return;

  const result = await buildHybridResult(input, localResult);
  currentResult = result.input ? result : null;
  renderResult(result);
  saveHistory(result);
  renderHistory();
  updateManualReviewLink();
});

if (clearBtn) {
  clearBtn.addEventListener("click", clearForm);
}

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });
}

if (loadExampleBtn) {
  loadExampleBtn.addEventListener("click", () => {
    inputEl.value = demos.bank;
    inputEl.focus();
    updateManualReviewLink();
  });
}

demoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    inputEl.value = demos[button.dataset.demo];
    inputEl.focus();
    updateManualReviewLink();
  });
});

inputEl.addEventListener("input", updateManualReviewLink);
if (caseForm) {
  caseForm.addEventListener("submit", handleCaseSubmit);
}
if (adminBtn) {
  adminBtn.addEventListener("click", openAdmin);
}
if (exportCasesBtn) {
  exportCasesBtn.addEventListener("click", exportCases);
}

if (resetUsageBtn) {
  resetUsageBtn.addEventListener("click", () => {
    const confirmed = window.confirm("¿Seguro que querés reiniciar las verificaciones?");
    if (!confirmed) return;

    localStorage.removeItem(USAGE_STORAGE_KEY);
    const usage = createDefaultUsage();
    saveUsage(usage);
    updateUsageDisplay(usage);
  });
}

if (analyzeSharedBtn) {
  analyzeSharedBtn.addEventListener("click", () => {
    analyzeBtn.click();
  });
}

if (androidNotifyBtn) {
  androidNotifyBtn.addEventListener("click", () => {
    const url = buildAndroidNotifyUrl();
    if (!url) return;
    window.open(url, "_blank", "noopener");
  });
}

if (shareSiteBtn) {
  shareSiteBtn.addEventListener("click", shareSite);
}

if (openWhatsappGuideBtn) {
  openWhatsappGuideBtn.addEventListener("click", openWhatsappGuide);
}

if (openShareGuideBtn) {
  openShareGuideBtn.addEventListener("click", openShareGuide);
}

if (closeWhatsappGuideBtn) {
  closeWhatsappGuideBtn.addEventListener("click", closeWhatsappGuide);
}

if (understoodWhatsappGuideBtn) {
  understoodWhatsappGuideBtn.addEventListener("click", closeWhatsappGuide);
}

if (guideImage) {
  guideImage.addEventListener("error", () => {
    guideImage.hidden = true;
    if (guideImagePlaceholder) guideImagePlaceholder.hidden = false;
  });

  guideImage.addEventListener("load", () => {
    guideImage.hidden = false;
    if (guideImagePlaceholder) guideImagePlaceholder.hidden = true;
  });
}

if (whatsappGuideModal) {
  whatsappGuideModal.addEventListener("click", (event) => {
    if (event.target === whatsappGuideModal) closeWhatsappGuide();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && whatsappGuideModal && !whatsappGuideModal.hidden) {
    closeWhatsappGuide();
  }
});

if (manualReviewLink) {
  manualReviewLink.addEventListener("click", (event) => {
    if (isWhatsAppConfigured()) return;
    event.preventDefault();
    showManualReviewMessage("WhatsApp no configurado todavía.", "error");
  });
}

if (adminCasesList) {
  adminCasesList.addEventListener("click", (event) => {
    const reviewId = event.target.dataset.review;
    const deleteId = event.target.dataset.delete;

    if (reviewId) updateCaseStatus(reviewId, "reviewed");
    if (deleteId) deleteCase(deleteId);
  });
}

updateManualReviewLink();
recoverFreeChecksIfNeeded();
setupInstallPrompt();
registerServiceWorker();
loadSharedTextFromUrl();
renderHistory();
