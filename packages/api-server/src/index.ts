/**
 * Public API for @in-app-training/api-server.
 *
 * Framework-agnostic surface — the Fastify plugin lives under
 * `@in-app-training/api-server/fastify` so consumers who bring their own
 * HTTP framework can wire the handlers directly without pulling fastify.
 */

export type { ContentBundle, ContentStore } from './store.js';
export { createInMemoryContentStore } from './store.js';

export type { Scope, TokenClaims, TokenVerifier } from './auth.js';
export { extractBearer, hasScope } from './auth.js';

export type { HandlerRequest, HandlerResponse, ServerDeps } from './handlers.js';
export { getContent, getContentHistory, publishContent, forgetUser } from './handlers.js';

export { openapiSpec } from './openapi.js';
export type { OpenApiOptions } from './openapi.js';

export { computeEtag, ifNoneMatch } from './etag.js';
export { problem } from './errors.js';
export type { Problem } from './errors.js';
