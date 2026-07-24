import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
// --- 1. SECRETS MANAGER SERVICE ---
export class SecretsManager {
  private secrets = new Map<string, string>();
  private defaultSecrets: Record<string, string> = {
    JWT_SECRET: process.env.JWT_SECRET || "iposense_jwt_secret_signing_key_987654321",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "iposense_jwt_refresh_secret_key_123456789",
    GROQ_API_KEY: process.env.GROQ_API_KEY || "",
    NSE_SCRAPE_KEY: "nse_scraping_system_secret_key",
    AES_SECRET: process.env.ENCRYPTION_KEY || "d6f51952a2d48858e3b567ef54fa86aa",
    CSRF_STRICT_MODE: "true",
    RATE_LIMIT_WINDOW_MS: "9000000000000", // 15 mins
    RATE_LIMIT_MAX_REQUESTS: "1000000000000000",
    RATE_LIMIT_STRICT_MAX_REQUESTS: "150000000" // for auth, admin, etc
  };

  constructor() {
    // Seed default values
    Object.keys(this.defaultSecrets).forEach((key) => {
      this.secrets.set(key, this.defaultSecrets[key]);
    });
  }

  public get(key: string): string {
    return this.secrets.get(key) || process.env[key] || "";
  }

  public set(key: string, value: string): void {
    this.secrets.set(key, value.trim());
    console.log(`[Secrets Manager] Runtime configuration rotated/updated: ${key}`);
  }

  public getKeys(): string[] {
    return Array.from(this.secrets.keys());
  }

  public getMaskedSecrets(): Record<string, string> {
    const masked: Record<string, string> = {};
    this.secrets.forEach((val, key) => {
      if (!val || val.trim() === "") {
        masked[key] = "(Not Configured / Empty)";
      } else if (val.length <= 6) {
        masked[key] = "******";
      } else {
        masked[key] = val.substring(0, 3) + "..." + val.substring(val.length - 3);
      }
    });
    return masked;
  }
}

export const secretsManager = new SecretsManager();


// --- 2. REFRESH TOKEN BLACKLIST/REVOCATION REGISTER ---
export const revokedRefreshTokens = new Set<string>();

export function revokeRefreshToken(token: string): void {
  if (token) {
    revokedRefreshTokens.add(token);
    // Auto-clean old blacklisted tokens size caps
    if (revokedRefreshTokens.size > 20000) {
      const firstVal = revokedRefreshTokens.values().next().value;
      if (firstVal) revokedRefreshTokens.delete(firstVal);
    }
  }
}

export function isRefreshTokenRevoked(token: string): boolean {
  return revokedRefreshTokens.has(token);
}


// --- 3. CUSTOM SLIDING WINDOW RATE LIMITER ---
export interface RateLimitLog {
  id: string;
  ip: string;
  timestamp: string;
  path: string;
  method: string;
  status: "allowed" | "blocked";
}

const rateLimitStore = new Map<string, number[]>();
export const rateLimitLogs: RateLimitLog[] = [];

export function customRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "127.0.0.1";
  const now = Date.now();
  const path = req.path;
  const method = req.method;

  // Read configurations dynamically from secrets manager
  const windowMs = parseInt(secretsManager.get("RATE_LIMIT_WINDOW_MS")) || Number.MAX_SAFE_INTEGER;
  const maxRequests = parseInt(secretsManager.get("RATE_LIMIT_MAX_REQUESTS")) || Number.MAX_SAFE_INTEGER;
  const strictLimit = parseInt(secretsManager.get("RATE_LIMIT_STRICT_MAX_REQUESTS")) || Number.MAX_SAFE_INTEGER;

  // Cleanup past window records
  let requests = rateLimitStore.get(ip) || [];
  requests = requests.filter((time) => now - time < windowMs);

  const isSensitiveEndpoint = 
    path.includes("/api/auth/") || 
    path.includes("/api/admin/") || 
    path.includes("/api/historical-ipos") ||
    path.includes("/api/groq/");

  const activeLimit = isSensitiveEndpoint ? strictLimit : maxRequests;

  if (activeLimit < Number.MAX_SAFE_INTEGER && requests.length >= activeLimit) {
    // Record Blocked Attempt
    const logItem: RateLimitLog = {
      id: crypto.randomBytes(8).toString("hex"),
      ip,
      timestamp: new Date().toISOString(),
      path,
      method,
      status: "blocked"
    };
    rateLimitLogs.unshift(logItem);
    if (rateLimitLogs.length > 300) rateLimitLogs.pop();

    console.warn(`[Rate Limiting] Blocked request from ${ip} for ${path}. Threshold exceeded: ${activeLimit}`);
    return res.status(429).json({
      error: "API rate limit hit",
      code: "RATE_LIMIT_HIT",
      message: `Too many requests from this IP. Please wait before trying again. (Limit: ${activeLimit} requests per ${windowMs / 1000 / 60} minutes)`
    });
  }

  // Allow Request
  requests.push(now);
  rateLimitStore.set(ip, requests);

  const logItem: RateLimitLog = {
    id: crypto.randomBytes(8).toString("hex"),
    ip,
    timestamp: new Date().toISOString(),
    path,
    method,
    status: "allowed"
  };
  rateLimitLogs.unshift(logItem);
  if (rateLimitLogs.length > 300) rateLimitLogs.pop();

  next();
}


// --- 4. DOUBLE-SUBMIT/HEADER TOKEN CSRF PROTECTION ---
export const activeCsrfTokens = new Map<string, number>();

export function generateCsrfToken(): string {
  const token = crypto.randomBytes(32).toString("hex");
  activeCsrfTokens.set(token, Date.now());

  if (activeCsrfTokens.size > 20000) {
    const firstVal = activeCsrfTokens.keys().next().value;
    if (firstVal) activeCsrfTokens.delete(firstVal);
  }

  return token;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Safe methods do not require CSRF checks
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const isCsrfStrict = secretsManager.get("CSRF_STRICT_MODE") === "true";
  const csrfExemptRoutes = [
    "/api/groq/chat",
    "/api/groq/analyze"
  ];

  if (csrfExemptRoutes.includes(req.path)) {
    return next();
  }

  if (!isCsrfStrict) {
    return next();
  }

  const csrfTokenHeader = req.headers["x-csrf-token"];

  const tokenTime = typeof csrfTokenHeader === "string"
    ? activeCsrfTokens.get(csrfTokenHeader)
    : undefined;

  if (
    !csrfTokenHeader ||
    typeof csrfTokenHeader !== "string" ||
    !tokenTime ||
    Date.now() - tokenTime > 15 * 60 * 1000
  ) {
    console.warn(`[CSRF Protection] Blocked write operation to '${req.path}' from ${req.ip || "unknown"}. Invalid CSRF token header.`);
    return res.status(403).json({
      error: "CSRF token validation failed.",
      message: "Security violation: Modify operations must include a verified custom CSRF token header. Request a fresh token via GET /api/auth/csrf-token."
    });
  }

  next();
}


// --- 5. ENTERPRISE LEVEL SECURITY HEADERS ---
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // X-Frame-Options: Prevent Clickjacking
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  
  // X-Content-Type-Options: Disable MIME Sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // X-XSS-Protection: Strict Filter mode
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Referrer-Policy: Control cross-origin information leakage
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Strict-Transport-Security: Force HTTPS
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  
  // Content Security Policy: Strict resource authorization
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: wss:; img-src 'self' data: https:; font-src 'self' data: https:;"
  );

  next();
}


// --- 6. REQUEST SCHEMAS & XSS SANITATION VALIDATOR ---
export function validateRequest(schema: Record<string, "string" | "number" | "boolean" | "date" | "array" | "object" | "optional">) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Sanitise potential script injections from body
    const bodyStr = JSON.stringify(req.body);
    if (
      bodyStr.includes("<script") || 
      bodyStr.includes("javascript:") || 
      bodyStr.includes("onload=") || 
      bodyStr.includes("onerror=") || 
      bodyStr.includes("<iframe")
    ) {
      console.warn(`[XSS Shield] Blocked potential HTML injection payload on route ${req.path}`);
      return res.status(400).json({
        error: "Malicious payload validation failed.",
        message: "XSS Protection: Request parameters cannot contain script-injection strings, tags, or raw inline JS expressions."
      });
    }

    const errors: string[] = [];

    for (const key of Object.keys(schema)) {
      const expectedType = schema[key];
      const actualValue = req.body[key];

      if (expectedType === "optional") {
        continue;
      }

      if (actualValue === undefined || actualValue === null) {
        errors.push(`Required field '${key}' is missing.`);
        continue;
      }

      if (expectedType === "number") {
        if (isNaN(Number(actualValue))) {
          errors.push(`Field '${key}' must be a numeric value.`);
        }
      } else if (expectedType === "date") {
        if (isNaN(Date.parse(actualValue))) {
          errors.push(`Field '${key}' must be a valid, parseable ISO date string.`);
        }
      } else if (expectedType === "array") {
        if (!Array.isArray(actualValue)) {
          errors.push(`Field '${key}' must be an array type.`);
        }
      } else if (expectedType === "object") {
        if (typeof actualValue !== "object" || Array.isArray(actualValue)) {
          errors.push(`Field '${key}' must be a structural object.`);
        }
      } else {
        if (typeof actualValue !== expectedType) {
          errors.push(`Field '${key}' must be of type ${expectedType}.`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Payload validation failed.",
        details: errors
      });
    }

    next();
  };
}
