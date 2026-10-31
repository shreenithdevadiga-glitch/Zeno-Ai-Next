# ZENO AI NEXT — Security & Threat Modeling

Security is treated as a production-critical foundation in ZENO AI NEXT.

---

## 1. Attack Surface & Mitigations

### 1.1 SSRF (Server-Side Request Forgery) Protection
Any outbound request (web crawling, custom endpoints, document downloading) passes through `server/security/ssrf.js`.
- **Blocked Targets:**
  - Loopback (`127.0.0.0/8`, `::1`, `localhost`)
  - Private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
  - Cloud Metadata services (`169.254.169.254`)
  - Link-local and non-routable IPs
  - Non-HTTP protocols (`file://`, `gopher://`, `ftp://`)
- **DNS Resolution Check:** Resolved IP addresses are examined before connections are established to thwart DNS rebinding attacks.

### 1.2 Prompt Injection Defense
External content (web search results, uploaded documents, citations) is explicitly marked as untrusted external data within system context wrappers (`[LIVE SEARCH FINDINGS]`, `[RELEVANT RETRIEVED FILE CONTEXT]`). System directives instruct models to process retrieved text purely as informational reference data and never execute embedded control instructions.

### 1.3 Credential Masking & Storage
- API keys (OpenRouter, Gemini, NVIDIA, OpenAI, Tavily) are processed solely on the backend.
- Masking filters (`sk-***1234`) guarantee raw secret keys are never returned in JSON payloads or exposed in client bundles.
- System environment variables are separated from public telemetry.

### 1.4 Rate Limiting & DoS Protection
- Sliding window memory rate limiter protects against brute-force attacks and abuse.
- Standard limit: 120–240 requests/minute per IP, with explicit `Retry-After` headers.

### 1.5 Strict Security Headers
- `Content-Security-Policy`: Disallows unsafe external script injection and restricts frame ancestors.
- `X-Content-Type-Options: nosniff`: Prevents MIME-confusion attacks.
- `X-Frame-Options: DENY`: Blocks clickjacking.
- `Strict-Transport-Security`: Enforces HTTPS for modern web clients.
- `Permissions-Policy`: Restricts camera and geolocation access.

### 1.6 Authentication & Passwords
- Passwords are salted with 16 bytes of cryptographically secure random bytes (`crypto.randomBytes(16)`) and hashed using PBKDF2 with 100,000 iterations of SHA-512.
- Session tokens are stored in the database exclusively as SHA-256 hashes.
- Sessions automatically expire after 14 days and refresh `last_active_at` on verified requests.
