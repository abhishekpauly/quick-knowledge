/**
 * Bearer token verification — per ADR-0007.
 *
 * The server never mints tokens. Adopters plug a TokenVerifier that
 * talks to their existing auth service and returns the token subject
 * plus its scopes.
 */

export type Scope = 'content:read' | 'content:write' | 'users:forget';

export interface TokenClaims {
  subject: string;
  scopes: ReadonlyArray<Scope>;
}

export interface TokenVerifier {
  verify(token: string): Promise<TokenClaims | null>;
}

export function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export function hasScope(claims: TokenClaims, required: Scope): boolean {
  return claims.scopes.includes(required);
}
