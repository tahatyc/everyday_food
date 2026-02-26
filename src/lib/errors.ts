// Convex Password provider error codes mapped to user-friendly messages
const AUTH_ERROR_MAP: Record<string, string> = {
  InvalidAccountId:
    "No account found with this email. Check your email or sign up.",
  InvalidSecret: "Incorrect password. Please try again.",
  TooManyFailedAttempts:
    "Too many failed attempts. Please try again later.",
  AccountAlreadyExists:
    "An account with this email already exists. Please sign in instead.",
  InvalidFlow: "Something went wrong. Please try again.",
};

const GENERIC_AUTH_FALLBACK = "Something went wrong. Please try again.";

/**
 * Parses an auth error thrown by the Convex Password provider into a
 * user-friendly message.
 *
 * Decision logic:
 * 1. message contains a known auth error code → return mapped friendly string
 * 2. message contains spaces and is < 120 chars → it's human-readable, return as-is
 * 3. otherwise → return generic fallback
 */
export function parseAuthError(error: unknown): string {
  const message = extractMessage(error);

  // 1. Known auth code
  for (const [code, friendly] of Object.entries(AUTH_ERROR_MAP)) {
    if (message.includes(code)) {
      return friendly;
    }
  }

  // 2. Looks like a human-readable sentence
  if (message.includes(" ") && message.length < 120) {
    return message;
  }

  // 3. Generic fallback
  return GENERIC_AUTH_FALLBACK;
}

/**
 * Parses a Convex mutation error into a user-friendly message.
 * Returns `fallback` if the error message is not human-readable.
 */
export function parseMutationError(error: unknown, fallback: string): string {
  const message = extractMessage(error);

  if (message.includes(" ") && message.length < 120) {
    return message;
  }

  return fallback;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message ?? "";
  }
  if (typeof error === "string") {
    return error;
  }
  return "";
}
