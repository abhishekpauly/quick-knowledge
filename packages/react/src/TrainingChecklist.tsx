/**
 * <TrainingChecklist /> — persistent corner widget.
 *
 * Collapsed = pill with completion count. Expanded = grouped list of tours
 * by difficulty with completion checkmarks and prerequisite locking.
 *
 * Styling uses the theme's CSS variables so this widget matches the host
 * product automatically. Inline styles keep it dependency-free — no CSS
 * imports required from the consumer.
 *
 * State is deliberately kept in memory. Dismissal persistence would require a
 * dedicated persistence key; deferred until v0.2 when we know how sticky
 * users want the dismissal to be.
 */
import { useMemo, useState, useContext } from 'react';
import type { Tour, Difficulty, TourProgress } from '@uptiq/training-sdk';
import { TrainerContext } from './context.js';
import { useTour } from './useTour.js';
import { useTourProgress } from './useTourProgress.js';
import { useAllTourProgress } from './useAllTourProgress.js';

export interface TrainingChecklistProps {
  /** Corner to anchor the widget. Default 'bottom-right'. */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Widget label when collapsed. Default 'Getting started'. */
  label?: string;
  /** Optional filter — only show tours whose id is in this array. */
  tourIds?: string[];
  /**
   * Hide the widget while any tour is active, so it doesn't compete for
   * attention with a running tour. Default true (Sprint 5 behavior).
   * Set false to keep the widget visible mid-tour.
   */
  hideDuringActiveTour?: boolean;
}

const DIFFICULTY_ORDER: Difficulty[] = [
  'onboarding',
  'basic',
  'intermediate',
  'advanced',
  'common-task',
];

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  onboarding: 'Onboarding',
  basic: 'Basics',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  'common-task': 'Common tasks',
};

export function TrainingChecklist({
  position = 'bottom-right',
  label = 'Getting started',
  tourIds,
  hideDuringActiveTour = true,
}: TrainingChecklistProps): JSX.Element | null {
  const trainer = useContext(TrainerContext);
  if (!trainer) {
    throw new Error(
      '<TrainingChecklist> must be inside <TourProvider>. Wrap your app in <TourProvider trainer={...}>.',
    );
  }

  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { isActive } = useTour();
  const allProgress = useAllTourProgress();

  const tours = useMemo(() => {
    const all = trainer.getTours();
    return tourIds ? all.filter((t) => tourIds.includes(t.id)) : all;
  }, [trainer, tourIds]);

  const grouped = useMemo(() => groupByDifficulty(tours), [tours]);

  const completedCount = useMemo(
    () => tours.reduce((sum, t) => sum + (allProgress.get(t.id)?.status === 'completed' ? 1 : 0), 0),
    [tours, allProgress],
  );

  if (dismissed || tours.length === 0) return null;
  if (hideDuringActiveTour && isActive) return null;

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles(position),
        zIndex: 9999,
        fontFamily: 'var(--uptiq-training-font-family, system-ui, sans-serif)',
        fontSize: 'var(--uptiq-training-font-size, 14px)',
        color: 'var(--uptiq-training-foreground, #111827)',
      }}
      data-testid="training-checklist"
    >
      {expanded ? (
        <ExpandedPanel
          groups={grouped}
          label={label}
          allProgress={allProgress}
          onCollapse={() => setExpanded(false)}
          onDismiss={() => setDismissed(true)}
        />
      ) : (
        <CollapsedPill
          totalCount={tours.length}
          completedCount={completedCount}
          label={label}
          onExpand={() => setExpanded(true)}
        />
      )}
    </div>
  );
}

function CollapsedPill({
  label,
  totalCount,
  completedCount,
  onExpand,
}: {
  label: string;
  totalCount: number;
  completedCount: number;
  onExpand: () => void;
}): JSX.Element {
  return (
    <button
      onClick={onExpand}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--uptiq-training-background, #fff)',
        color: 'var(--uptiq-training-foreground, #111827)',
        border: '1px solid var(--uptiq-training-border, #e2e8f0)',
        borderRadius: 'var(--uptiq-training-radius, 999px)',
        boxShadow: 'var(--uptiq-training-shadow, 0 4px 12px rgba(0,0,0,0.1))',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 'inherit',
      }}
      data-testid="training-checklist-pill"
    >
      <span aria-hidden>📖</span>
      <span>{label}</span>
      <span
        style={{
          padding: '2px 8px',
          background: 'var(--uptiq-training-primary, #2563eb)',
          color: '#fff',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        {completedCount}/{totalCount}
      </span>
    </button>
  );
}

function ExpandedPanel({
  groups,
  label,
  allProgress,
  onCollapse,
  onDismiss,
}: {
  groups: Array<[Difficulty, Tour[]]>;
  label: string;
  allProgress: Map<string, TourProgress>;
  onCollapse: () => void;
  onDismiss: () => void;
}): JSX.Element {
  return (
    <div
      style={{
        width: 320,
        maxHeight: '80vh',
        overflow: 'auto',
        background: 'var(--uptiq-training-background, #fff)',
        border: '1px solid var(--uptiq-training-border, #e2e8f0)',
        borderRadius: 'var(--uptiq-training-radius, 12px)',
        boxShadow: 'var(--uptiq-training-shadow, 0 10px 25px rgba(0,0,0,0.1))',
      }}
      data-testid="training-checklist-panel"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--uptiq-training-border, #e2e8f0)',
          fontWeight: 600,
        }}
      >
        <span>{label}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton onClick={onCollapse} aria-label="Collapse">
            _
          </IconButton>
          <IconButton onClick={onDismiss} aria-label="Dismiss">
            ×
          </IconButton>
        </div>
      </div>
      <div style={{ padding: 8 }}>
        {groups.map(([difficulty, tours]) => (
          <div key={difficulty} style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#64748b',
                padding: '4px 8px',
              }}
            >
              {DIFFICULTY_LABEL[difficulty]}
            </div>
            {tours.map((tour) => (
              <ChecklistItem key={tour.id} tour={tour} allProgress={allProgress} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistItem({
  tour,
  allProgress,
}: {
  tour: Tour;
  allProgress: Map<string, TourProgress>;
}): JSX.Element {
  const trainer = useContext(TrainerContext)!;
  const { start } = useTour();
  // Read via allProgress (from parent) so we don't call a hook inside a loop
  // when the tour list is dynamic. Falls back to a sensible default if this
  // tour hasn't been touched yet.
  const progress = allProgress.get(tour.id) ?? {
    tourId: tour.id,
    status: 'not-started' as const,
    currentStepIndex: 0,
  };
  const locked = !arePrerequisitesMet(trainer.getTours(), tour, (id) => trainer.getProgress(id));
  const isDone = progress.status === 'completed';
  const cursor = locked ? 'not-allowed' : 'pointer';
  const opacity = locked ? 0.5 : 1;
  // Resolve LocalizedString for display. Note: this is a display-side fallback —
  // the trainer resolves for tour steps. We don't have locale here (would need
  // to plumb through TrainerConfig); use the first string it resolves to.
  const titleText = typeof tour.title === 'string' ? tour.title : Object.values(tour.title)[0] ?? tour.id;
  const descText =
    tour.description === undefined
      ? undefined
      : typeof tour.description === 'string'
      ? tour.description
      : Object.values(tour.description)[0];

  return (
    <button
      disabled={locked}
      onClick={() => {
        if (!locked) void start(tour.id);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 8px',
        background: 'transparent',
        color: 'inherit',
        border: 0,
        borderRadius: 6,
        cursor,
        opacity,
        textAlign: 'left',
        fontFamily: 'inherit',
        fontSize: 'inherit',
      }}
      data-testid={`training-checklist-item-${tour.id}`}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: '1.5px solid var(--uptiq-training-border, #e2e8f0)',
          background: isDone ? 'var(--uptiq-training-primary, #2563eb)' : 'transparent',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontSize: 12,
          flexShrink: 0,
        }}
        aria-label={isDone ? 'Completed' : 'Not started'}
      >
        {isDone ? '✓' : ''}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500 }}>{titleText}</div>
        {descText && (
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{descText}</div>
        )}
      </div>
      {tour.estimatedMinutes && (
        <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>
          {tour.estimatedMinutes}m
        </span>
      )}
    </button>
  );
}

function IconButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element {
  return (
    <button
      {...rest}
      style={{
        width: 24,
        height: 24,
        border: 0,
        background: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        borderRadius: 4,
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

// Helpers -----------------------------------------------------------------

function positionStyles(pos: TrainingChecklistProps['position']): React.CSSProperties {
  const map = {
    'bottom-right': { bottom: 24, right: 24 },
    'bottom-left': { bottom: 24, left: 24 },
    'top-right': { top: 24, right: 24 },
    'top-left': { top: 24, left: 24 },
  } as const;
  return map[pos ?? 'bottom-right'];
}

function groupByDifficulty(tours: readonly Tour[]): Array<[Difficulty, Tour[]]> {
  const buckets = new Map<Difficulty, Tour[]>();
  for (const t of tours) {
    const list = buckets.get(t.difficulty) ?? [];
    list.push(t);
    buckets.set(t.difficulty, list);
  }
  return DIFFICULTY_ORDER.filter((d) => buckets.has(d)).map((d) => [d, buckets.get(d)!]);
}

// Sprint 5: countCompleted retired — the widget now uses useAllTourProgress
// at the parent for reactive per-tour progress + aggregated pill count.

function arePrerequisitesMet(
  allTours: readonly Tour[],
  tour: Tour,
  getProgress: (id: string) => { status: string },
): boolean {
  if (!tour.prerequisites || tour.prerequisites.length === 0) return true;
  return tour.prerequisites.every((id) => {
    const p = getProgress(id);
    return p.status === 'completed';
  });
}
