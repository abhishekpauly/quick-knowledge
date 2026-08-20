/**
 * Content schema v1 — the source of truth for tour JSON.
 *
 * Zod at the top; TypeScript types inferred at the bottom. Runtime validation and
 * static types stay in lock-step because they come from one place.
 *
 * When evolving:
 *   - Non-breaking additions → add optional fields here. No version bump.
 *   - Breaking changes → create v2.ts. Support both versions in the loader
 *     until every tour has been migrated. See ADR-0003.
 *
 * Sprint 5 additions (non-breaking):
 *   - `audience` on Tour: array of `key:value` (or `!key:value`) atoms filtered
 *     against TrainerConfig.userAttributes.
 *   - LocalizedString: user-facing fields (title, body, description) accept
 *     either a plain string OR a locale map `{ [locale]: string }`. The resolver
 *     picks by TrainerConfig.locale with a documented fallback.
 */
import { z } from 'zod';

// Matches the data-tour contract exactly. See ADR-0002 and docs/data-tour-conventions.md.
const dataTourSelector = z
  .string()
  .regex(
    /^\[data-tour="[a-z0-9][a-z0-9-]*[a-z0-9]"\]$/,
    'Selector must be [data-tour="kebab-case-id"] — see docs/data-tour-conventions.md',
  );

/**
 * LocalizedString — string OR `{ locale: string }` map.
 * Backward compatible: every existing plain-string field still validates.
 * See resolveLocale() in schema/localize.ts.
 */
export const LocalizedStringSchema = z.union([
  z.string().min(1),
  z.record(z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Locale must be BCP-47-like'), z.string().min(1)),
]);

export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

export const PlacementSchema = z.enum(['top', 'bottom', 'left', 'right', 'center']);

export const DifficultySchema = z.enum([
  'onboarding',
  'basic',
  'intermediate',
  'advanced',
  'common-task',
]);

export const MediaSchema = z.object({
  type: z.enum(['image', 'video']),
  src: z.string().url(),
  alt: z.string().min(1),
});

export const ActionSchema = z.object({
  label: LocalizedStringSchema,
  action: z.enum(['next', 'prev', 'complete', 'dismiss']),
});

export const ActionsSchema = z.object({
  primary: ActionSchema.optional(),
  secondary: ActionSchema.optional(),
});

export const AdvanceOnSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('click'), target: dataTourSelector }),
  z.object({ type: z.literal('input'), target: dataTourSelector }),
  z.object({ type: z.literal('url'), pattern: z.string().min(1) }),
  z.object({ type: z.literal('event'), name: z.string().min(1) }),
]);

export const TriggerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('manual') }),
  z.object({ type: z.literal('first-run') }),
  z.object({ type: z.literal('url'), pattern: z.string().min(1) }),
  z.object({ type: z.literal('event'), name: z.string().min(1) }),
]);

/**
 * Step type discriminator. Sprint 6 addition.
 * - "tooltip"  — default. Anchored tooltip, current behavior.
 * - "slideout" — panel slides in from an edge. `placement` picks the edge.
 * - "hotspot"  — pulsing beacon on the target; user click advances.
 * - "redirect" — navigates to `redirectUrl`, waits, then advances. No tooltip UI.
 */
export const StepTypeSchema = z.enum(['tooltip', 'slideout', 'hotspot', 'redirect']);
export type StepType = z.infer<typeof StepTypeSchema>;

export const StepSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Step id must be kebab-case')
    .min(1),
  target: dataTourSelector,
  placement: PlacementSchema,
  title: LocalizedStringSchema.optional(),
  body: LocalizedStringSchema.optional(),
  media: MediaSchema.nullable().optional(),
  actions: ActionsSchema.optional(),
  advanceOn: AdvanceOnSchema.nullable().optional(),
  notes: z.string().optional(), // Author-only. Not shown to users.
  /** Sprint 6: default "tooltip" if omitted. Backward compatible. */
  stepType: StepTypeSchema.optional(),
  /** Sprint 6: for stepType="redirect". Absolute URL or path. */
  redirectUrl: z.string().min(1).optional(),
  /** Sprint 6: for stepType="redirect". Wait this many ms after navigation before advancing. Default 500. */
  redirectWaitMs: z.number().int().nonnegative().optional(),
});

/**
 * Sprint 6: frequency-limit config. Controls how often a tour can re-appear
 * for the same user via automatic triggers.
 * - "once"    — after any run (completed OR dismissed), never re-trigger. Default.
 * - "session" — once per browser session (persistence-cleared on tab close).
 * - "day"     — once per calendar day.
 * - "week"    — once per rolling 7 days.
 * - "always"  — no limit; auto-triggers fire every time they qualify.
 */
export const FrequencySchema = z.enum(['once', 'session', 'day', 'week', 'always']);
export type Frequency = z.infer<typeof FrequencySchema>;

/**
 * Audience atom: `key:value` matches attribute exactly; `!key:value` negates.
 * Every atom must match (AND). Multiple atoms across tours = OR at tour-set level.
 * Example: audience: ["plan:enterprise", "!role:trial"]
 */
const AudienceAtomSchema = z
  .string()
  .regex(/^!?[a-zA-Z0-9_.-]+:.+$/, 'Audience atom must be `key:value` or `!key:value`');

export const TourSchema = z.object({
  schemaVersion: z.literal('v1'),
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Tour id must be kebab-case')
    .min(1),
  product: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Product must be kebab-case')
    .min(1),
  title: LocalizedStringSchema,
  description: LocalizedStringSchema.optional(),
  difficulty: DifficultySchema,
  estimatedMinutes: z.number().int().positive().optional(),
  triggers: z.array(TriggerSchema).min(1, 'At least one trigger is required'),
  prerequisites: z.array(z.string()).optional(),
  audience: z.array(AudienceAtomSchema).optional(),
  /** Sprint 6: default "once" if omitted. */
  frequency: FrequencySchema.optional(),
  /** Sprint 6: higher wins when multiple auto-triggers fire concurrently. Default 0. */
  priority: z.number().int().optional(),
  steps: z.array(StepSchema).min(1, 'A tour must have at least one step'),
});

export type Placement = z.infer<typeof PlacementSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type Media = z.infer<typeof MediaSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type Actions = z.infer<typeof ActionsSchema>;
export type AdvanceOn = z.infer<typeof AdvanceOnSchema>;
export type Trigger = z.infer<typeof TriggerSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Tour = z.infer<typeof TourSchema>;

export const SCHEMA_VERSION = 'v1' as const;
