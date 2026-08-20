/**
 * Contextual hints schema.
 *
 * Hints are the counterpart to tours — short, always-available explanations of
 * a single UI element or concept. Authored per product in `hints.json`.
 *
 * The React adapter's `<TrainingHint id="...">` component reads from this
 * source. Hints have no lifecycle, no completion tracking, no analytics beyond
 * an optional `hint_viewed` event (added when it becomes useful).
 */
import { z } from 'zod';

export const HintSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Hint id must be kebab-case')
    .min(1),
  title: z.string().optional(),
  /** Markdown supported. Keep short — one to two sentences. */
  body: z.string().min(1).max(280, 'Hint body must be 280 chars or fewer. Split or link out.'),
  /** Optional: link to fuller docs. */
  learnMoreUrl: z.string().url().optional(),
  notes: z.string().optional(), // Author-only.
});

export const HintsFileSchema = z.object({
  schemaVersion: z.literal('v1'),
  product: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
    .min(1),
  hints: z.array(HintSchema).min(1),
});

export type Hint = z.infer<typeof HintSchema>;
export type HintsFile = z.infer<typeof HintsFileSchema>;

export function parseHints(raw: unknown): {
  ok: boolean;
  file?: HintsFile;
  errors?: Array<{ path: string; message: string }>;
} {
  const result = HintsFileSchema.safeParse(raw);
  if (result.success) return { ok: true, file: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join('.') || '<root>',
      message: issue.message,
    })),
  };
}
