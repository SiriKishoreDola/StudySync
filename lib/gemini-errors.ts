/** Safe diagnostics only: never expose provider messages, headers, URLs, or prompts. */
export function classifyGeminiError(error: unknown, timedOut = false) {
  const knownCodes = new Set(["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "SELF_SIGNED_CERT_IN_CHAIN", "DEPTH_ZERO_SELF_SIGNED_CERT", "CERT_HAS_EXPIRED", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY", "ERR_TLS_CERT_ALTNAME_INVALID"]);
  const knownReasons = ["API_KEY_INVALID", "API_KEY_EXPIRED", "API_KEY_SERVICE_BLOCKED", "API_KEY_HTTP_REFERRER_BLOCKED", "API_KEY_IP_ADDRESS_BLOCKED", "SERVICE_DISABLED", "BILLING_DISABLED", "RESOURCE_EXHAUSTED", "NOT_FOUND", "INVALID_ARGUMENT", "UNAUTHENTICATED", "PERMISSION_DENIED", "INTERNAL", "UNAVAILABLE", "DEADLINE_EXCEEDED"];
  let code: string | undefined;
  let upstreamStatus: number | undefined;
  let reason: string | undefined;
  let current = error;
  for (let i = 0; i < 8 && current && typeof current === "object"; i++) {
    const item = current as { status?: unknown; code?: unknown; message?: unknown; name?: unknown; cause?: unknown };
    if (typeof item.status === "number" && Number.isInteger(item.status) && item.status >= 400 && item.status <= 599) upstreamStatus ??= item.status;
    if (typeof item.code === "string" && knownCodes.has(item.code)) code ??= item.code;
    if (typeof item.message === "string") reason ??= knownReasons.find(value => item.message!.toString().includes(value));
    if (item.name === "AbortError" || item.name === "TimeoutError") timedOut = true;
    current = item.cause;
  }
  let category = "unknown";
  let status = 502;
  let message = "Gemini failed unexpectedly. Check the sanitized server diagnostic before retrying.";
  if (timedOut || upstreamStatus === 504 || reason === "DEADLINE_EXCEEDED" || code?.includes("TIMEOUT") || code === "ETIMEDOUT") {
    category = "timeout"; status = 504; message = "Gemini took too long. Please retry when ready.";
  } else if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    category = "dns"; message = "The server could not resolve Google's API hostname. Check DNS or VPN settings.";
  } else if (code && /CERT|SIGNATURE|ISSUER/.test(code)) {
    category = "tls"; message = "The server could not verify Google's TLS certificate. Check the trusted CA configuration; do not disable TLS verification.";
  } else if (code) {
    category = "network"; message = "The server's connection to Gemini failed. Check network, proxy, or VPN settings.";
  } else if (upstreamStatus === 429 || reason === "RESOURCE_EXHAUSTED") {
    category = "quota"; status = 429; message = "Gemini quota or rate limit reached. Wait before retrying; check your project's quota in Google AI Studio.";
  } else if (upstreamStatus === 401 || upstreamStatus === 403 || reason?.startsWith("API_KEY_") || reason === "UNAUTHENTICATED") {
    category = "credentials"; status = 503; message = "Gemini rejected the server key or project access. Replace or correct GEMINI_API_KEY in root .env.local and restart the dev server.";
  } else if (upstreamStatus === 404 || reason === "NOT_FOUND") {
    category = "model"; status = 503; message = "The configured Gemini model is unavailable for this project. Check model access.";
  } else if (upstreamStatus === 400) {
    category = "invalid_request"; message = "Gemini rejected the request configuration. Check the sanitized server diagnostic.";
  } else if (upstreamStatus && upstreamStatus >= 500) {
    category = "provider"; status = upstreamStatus === 503 ? 503 : 502; message = "Gemini is temporarily unavailable. Please retry later.";
  }
  return { status, message, diagnostic: { category, upstreamStatus, code, reason } };
}
