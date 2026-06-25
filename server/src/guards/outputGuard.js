/**
 * @fileoverview Output Guard - Inspects outgoing responses for sensitive information.
 */

const secretPatterns = {
  jwt: /ey[A-Za-z0-9-_=]+\.ey[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/,
  bearerToken: /Bearer\s+[a-zA-Z0-9-_.+=/]+/,
  openAiKey: /sk-[a-zA-Z0-9]{48}/,
  googleApiKey: /AIza[0-9A-Za-z-_]{35}/,
  githubToken: /(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}/,
  awsCreds: /(AKIA|ASIA)[0-9A-Z]{16}/,
  supabaseKey: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*/,
  mongoDb: /mongodb(\+srv)?:\/\/[a-zA-Z0-9:]+@[a-zA-Z0-9.-]+/,
  privateKey: /-----BEGIN (RSA|OPENSSH|DSA|EC|PGP) PRIVATE KEY-----/,
  stackTrace: /Error:.*\n(\s+at .*\n)+/i,
  envVars: /process\.env\.[A-Za-z0-9_]+/
};

export const filterOutput = (response) => {
  for (const [key, pattern] of Object.entries(secretPatterns)) {
    if (pattern.test(response)) {
      return {
        allowed: false,
        reason: `Blocked by Output Guard: Sensitive information detected (${key}).`,
        severity: "high",
        category: "sensitive_output",
        riskScore: 95
      };
    }
  }

  return {
    allowed: true,
    reason: "Output is safe.",
    severity: "low",
    category: "safe",
    riskScore: 0
  };
};
