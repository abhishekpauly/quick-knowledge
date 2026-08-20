/**
 * <TrainingHint id="..." /> — inline `?` icon that reveals a hint on hover
 * or click.
 *
 * Content comes from <HintsProvider>. Missing IDs surface a visible warning in
 * dev; in production they render nothing (silent failure would hide bugs, loud
 * failure would break the user's page).
 */
import { useState } from 'react';
import { useHintsContext } from './HintsProvider.js';

export interface TrainingHintProps {
  /** Hint id matching a hint in the loaded hints file. */
  id: string;
  /** Optional label to render instead of the default `?`. */
  children?: React.ReactNode;
}

const IS_DEV = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

export function TrainingHint({ id, children }: TrainingHintProps): JSX.Element | null {
  const { hintsById } = useHintsContext();
  const hint = hintsById.get(id);
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);

  if (!hint) {
    if (IS_DEV) {
      return (
        <span
          style={{
            color: '#ef4444',
            background: '#fee2e2',
            padding: '0 4px',
            borderRadius: 3,
            fontSize: 12,
            fontFamily: 'monospace',
          }}
          title={`Missing hint id: ${id}`}
        >
          !{id}
        </span>
      );
    }
    return null;
  }

  const visible = hovering || pinned;

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <button
        type="button"
        aria-label={hint.title ?? 'Hint'}
        aria-expanded={visible}
        onClick={(e) => {
          e.stopPropagation();
          setPinned((p) => !p);
        }}
        style={{
          display: 'inline-grid',
          placeItems: 'center',
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '1px solid var(--uptiq-training-border, #cbd5e1)',
          background: pinned ? 'var(--uptiq-training-primary, #2563eb)' : 'transparent',
          color: pinned ? '#fff' : 'var(--uptiq-training-foreground, #64748b)',
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1,
          cursor: 'pointer',
          padding: 0,
        }}
        data-testid={`training-hint-trigger-${id}`}
      >
        {children ?? '?'}
      </button>
      {visible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 9998,
            width: 240,
            padding: 12,
            background: 'var(--uptiq-training-background, #fff)',
            color: 'var(--uptiq-training-foreground, #111827)',
            border: '1px solid var(--uptiq-training-border, #e2e8f0)',
            borderRadius: 'var(--uptiq-training-radius, 8px)',
            boxShadow: 'var(--uptiq-training-shadow, 0 10px 25px rgba(0,0,0,0.1))',
            fontFamily: 'var(--uptiq-training-font-family, system-ui, sans-serif)',
            fontSize: 'var(--uptiq-training-font-size, 13px)',
            lineHeight: 1.45,
          }}
          data-testid={`training-hint-body-${id}`}
        >
          {hint.title && (
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{hint.title}</div>
          )}
          <div>{hint.body}</div>
          {hint.learnMoreUrl && (
            <div style={{ marginTop: 8 }}>
              <a
                href={hint.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--uptiq-training-primary, #2563eb)',
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Learn more →
              </a>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
