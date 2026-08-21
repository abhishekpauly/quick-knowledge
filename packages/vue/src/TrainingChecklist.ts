/**
 * <TrainingChecklist /> — Vue counterpart.
 * Same UX as the React component: collapsed corner pill, expandable panel,
 * per-difficulty grouping, prerequisite locking, reactive completion count,
 * auto-suppress under active tour.
 */
import {
  defineComponent,
  ref,
  computed,
  inject,
  onMounted,
  onBeforeUnmount,
  h,
  type PropType,
} from 'vue';
import type { Tour, Difficulty, TourProgress } from '@in-app-training/sdk';
import { TrainerKey } from './inject-keys.js';
import { useTour } from './useTour.js';
import { useAllTourProgress } from './useAllTourProgress.js';
import { pickFreeCorner, type Corner } from './pickFreeCorner.js';

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

export const TrainingChecklist = defineComponent({
  name: 'TrainingChecklist',
  props: {
    position: {
      type: String as PropType<Corner>,
      default: 'bottom-right',
    },
    /**
     * Ordered list of corners to try. Picks the first with a free probe
     * point; falls back to the last if all are occupied. Added in Sprint 08
     * (T-092) after the v0.1.0 5-user test caught a collision with AI
     * Platform's help launcher for 1/5 users. If unset, `position` is used.
     */
    preferredCorners: {
      type: Array as PropType<Corner[]>,
      required: false,
    },
    label: { type: String, default: 'Getting started' },
    tourIds: { type: Array as PropType<string[]>, required: false },
    hideDuringActiveTour: { type: Boolean, default: true },
  },
  setup(props) {
    const trainer = inject(TrainerKey);
    if (!trainer) {
      throw new Error('<TrainingChecklist> must be inside <TourProvider>.');
    }

    const expanded = ref(false);
    const dismissed = ref(false);
    const pickedCorner = ref<Corner>(props.preferredCorners?.[0] ?? props.position);

    let onResize: (() => void) | null = null;
    onMounted(() => {
      const list = props.preferredCorners;
      if (!list || list.length === 0) return;
      const pick = (): void => {
        pickedCorner.value = pickFreeCorner(list);
      };
      pick();
      onResize = pick;
      window.addEventListener('resize', onResize);
    });
    onBeforeUnmount(() => {
      if (onResize) window.removeEventListener('resize', onResize);
    });
    const { isActive, start } = useTour();
    const allProgress = useAllTourProgress();

    const tours = computed(() => {
      const all = trainer.getTours();
      return props.tourIds ? all.filter((t) => props.tourIds!.includes(t.id)) : all;
    });
    const grouped = computed(() => groupByDifficulty(tours.value));
    const completedCount = computed(() =>
      tours.value.reduce(
        (sum, t) => sum + (allProgress.value.get(t.id)?.status === 'completed' ? 1 : 0),
        0,
      ),
    );

    return () => {
      if (dismissed.value || tours.value.length === 0) return null;
      if (props.hideDuringActiveTour && isActive.value) return null;

      const style = {
        position: 'fixed' as const,
        ...positionStyles(pickedCorner.value),
        zIndex: '9999',
        fontFamily: 'var(--in-app-training-font-family, system-ui, sans-serif)',
        fontSize: 'var(--in-app-training-font-size, 14px)',
        color: 'var(--in-app-training-foreground, #111827)',
      };

      return h(
        'div',
        { style, 'data-testid': 'training-checklist', 'data-in-app-training': '1' },
        expanded.value
          ? renderPanel(
              grouped.value,
              props.label,
              allProgress.value,
              start,
              () => (expanded.value = false),
              () => (dismissed.value = true),
              (id) => arePrerequisitesMet(tours.value, id, (i) => trainer.getProgress(i)),
            )
          : renderPill(
              props.label,
              tours.value.length,
              completedCount.value,
              () => (expanded.value = true),
            ),
      );
    };
  },
});

function renderPill(label: string, total: number, completed: number, onExpand: () => void) {
  return h(
    'button',
    {
      onClick: onExpand,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        background: 'var(--in-app-training-background, #fff)',
        color: 'var(--in-app-training-foreground, #111827)',
        border: '1px solid var(--in-app-training-border, #e2e8f0)',
        borderRadius: 'var(--in-app-training-radius, 999px)',
        boxShadow: 'var(--in-app-training-shadow, 0 4px 12px rgba(0,0,0,0.1))',
        cursor: 'pointer',
      },
      'data-testid': 'training-checklist-pill',
    },
    [
      h('span', { 'aria-hidden': true }, '📖'),
      h('span', label),
      h(
        'span',
        {
          style: {
            padding: '2px 8px',
            background: 'var(--in-app-training-primary, #2563eb)',
            color: '#fff',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: '500',
          },
        },
        `${completed}/${total}`,
      ),
    ],
  );
}

function renderPanel(
  groups: Array<[Difficulty, Tour[]]>,
  label: string,
  allProgress: Map<string, TourProgress>,
  start: (id: string) => Promise<void>,
  onCollapse: () => void,
  onDismiss: () => void,
  isLocked: (tourId: string) => boolean,
) {
  return h(
    'div',
    {
      style: {
        width: '320px',
        maxHeight: '80vh',
        overflow: 'auto',
        background: 'var(--in-app-training-background, #fff)',
        border: '1px solid var(--in-app-training-border, #e2e8f0)',
        borderRadius: 'var(--in-app-training-radius, 12px)',
        boxShadow: 'var(--in-app-training-shadow, 0 10px 25px rgba(0,0,0,0.1))',
      },
      'data-testid': 'training-checklist-panel',
    },
    [
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--in-app-training-border, #e2e8f0)',
            fontWeight: '600',
          },
        },
        [
          h('span', label),
          h('div', { style: { display: 'flex', gap: '4px' } }, [
            iconBtn('Collapse', '_', onCollapse),
            iconBtn('Dismiss', '×', onDismiss),
          ]),
        ],
      ),
      h(
        'div',
        { style: { padding: '8px' } },
        groups.map(([difficulty, tours]) =>
          h('div', { key: difficulty, style: { marginBottom: '12px' } }, [
            h(
              'div',
              {
                style: {
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748b',
                  padding: '4px 8px',
                },
              },
              DIFFICULTY_LABEL[difficulty],
            ),
            ...tours.map((tour) => renderItem(tour, allProgress, start, isLocked(tour.id))),
          ]),
        ),
      ),
    ],
  );
}

function renderItem(
  tour: Tour,
  allProgress: Map<string, TourProgress>,
  start: (id: string) => Promise<void>,
  locked: boolean,
) {
  const progress = allProgress.get(tour.id) ?? {
    tourId: tour.id,
    status: 'not-started' as const,
    currentStepIndex: 0,
  };
  const isDone = progress.status === 'completed';
  const titleText =
    typeof tour.title === 'string' ? tour.title : (Object.values(tour.title)[0] ?? tour.id);
  const descText =
    tour.description === undefined
      ? undefined
      : typeof tour.description === 'string'
        ? tour.description
        : Object.values(tour.description)[0];
  return h(
    'button',
    {
      key: tour.id,
      disabled: locked,
      onClick: () => {
        if (!locked) void start(tour.id);
      },
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '8px',
        background: 'transparent',
        color: 'inherit',
        border: '0',
        borderRadius: '6px',
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? '0.5' : '1',
        textAlign: 'left' as const,
      },
      'data-testid': `training-checklist-item-${tour.id}`,
    },
    [
      h(
        'span',
        {
          style: {
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            border: '1.5px solid var(--in-app-training-border, #e2e8f0)',
            background: isDone ? 'var(--in-app-training-primary, #2563eb)' : 'transparent',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontSize: '12px',
            flexShrink: '0',
          },
          'aria-label': isDone ? 'Completed' : 'Not started',
        },
        isDone ? '✓' : '',
      ),
      h('div', { style: { flex: '1', minWidth: '0' } }, [
        h('div', { style: { fontWeight: '500' } }, titleText),
        descText
          ? h('div', { style: { color: '#64748b', fontSize: '12px', marginTop: '2px' } }, descText)
          : null,
      ]),
      tour.estimatedMinutes
        ? h(
            'span',
            { style: { fontSize: '12px', color: '#64748b', flexShrink: '0' } },
            `${tour.estimatedMinutes}m`,
          )
        : null,
    ],
  );
}

function iconBtn(label: string, glyph: string, onClick: () => void) {
  return h(
    'button',
    {
      onClick,
      'aria-label': label,
      style: {
        width: '24px',
        height: '24px',
        border: '0',
        background: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        borderRadius: '4px',
        fontSize: '16px',
        lineHeight: '1',
      },
    },
    glyph,
  );
}

function positionStyles(pos: Corner): Record<string, string> {
  const map = {
    'bottom-right': { bottom: '24px', right: '24px' },
    'bottom-left': { bottom: '24px', left: '24px' },
    'top-right': { top: '24px', right: '24px' },
    'top-left': { top: '24px', left: '24px' },
  } as const;
  return map[pos];
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

function arePrerequisitesMet(
  allTours: readonly Tour[],
  tourId: string,
  getProgress: (id: string) => { status: string },
): boolean {
  const tour = allTours.find((t) => t.id === tourId);
  if (!tour?.prerequisites || tour.prerequisites.length === 0) return false; // returns "isLocked", so met = !locked
  return !tour.prerequisites.every((id) => getProgress(id).status === 'completed');
}
