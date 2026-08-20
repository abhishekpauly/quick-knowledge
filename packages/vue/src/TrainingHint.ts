/**
 * <TrainingHint id="..." /> — Vue counterpart of the React component.
 * Renders a `?` button; hover to show, click to pin. Missing IDs surface a
 * visible dev warning; silent in production.
 */
import { defineComponent, ref, inject, h, type PropType } from 'vue';
import { HintsKey } from './inject-keys.js';

const IS_DEV = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

export const TrainingHint = defineComponent({
  name: 'TrainingHint',
  props: {
    id: { type: String as PropType<string>, required: true },
  },
  setup(props, { slots }) {
    const ctx = inject(HintsKey);
    if (!ctx) {
      throw new Error(
        '<TrainingHint> requires a <HintsProvider>. Add <HintsProvider :hints="hints"> to your app root.',
      );
    }
    const pinned = ref(false);
    const hovering = ref(false);

    return () => {
      const hint = ctx.hintsById.get(props.id);
      if (!hint) {
        if (IS_DEV) {
          return h(
            'span',
            {
              style: {
                color: '#ef4444',
                background: '#fee2e2',
                padding: '0 4px',
                borderRadius: '3px',
                fontSize: '12px',
                fontFamily: 'monospace',
              },
              title: `Missing hint id: ${props.id}`,
            },
            `!${props.id}`,
          );
        }
        return null;
      }
      const visible = hovering.value || pinned.value;
      const trigger = h(
        'button',
        {
          type: 'button',
          'aria-label': hint.title ?? 'Hint',
          'aria-expanded': visible,
          onClick: (e: MouseEvent) => {
            e.stopPropagation();
            pinned.value = !pinned.value;
          },
          style: {
            display: 'inline-grid',
            placeItems: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: '1px solid var(--uptiq-training-border, #cbd5e1)',
            background: pinned.value ? 'var(--uptiq-training-primary, #2563eb)' : 'transparent',
            color: pinned.value ? '#fff' : 'var(--uptiq-training-foreground, #64748b)',
            fontSize: '11px',
            fontWeight: '600',
            lineHeight: '1',
            cursor: 'pointer',
            padding: '0',
          },
          'data-testid': `training-hint-trigger-${props.id}`,
        },
        slots.default?.() ?? '?',
      );
      const body = visible
        ? h(
            'div',
            {
              role: 'tooltip',
              style: {
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: '0',
                zIndex: '9998',
                width: '240px',
                padding: '12px',
                background: 'var(--uptiq-training-background, #fff)',
                color: 'var(--uptiq-training-foreground, #111827)',
                border: '1px solid var(--uptiq-training-border, #e2e8f0)',
                borderRadius: 'var(--uptiq-training-radius, 8px)',
                boxShadow: 'var(--uptiq-training-shadow, 0 10px 25px rgba(0,0,0,0.1))',
                fontSize: 'var(--uptiq-training-font-size, 13px)',
                lineHeight: '1.45',
              },
              'data-testid': `training-hint-body-${props.id}`,
            },
            [
              hint.title ? h('div', { style: { fontWeight: '600', marginBottom: '4px' } }, hint.title) : null,
              h('div', hint.body),
              hint.learnMoreUrl
                ? h(
                    'div',
                    { style: { marginTop: '8px' } },
                    h(
                      'a',
                      {
                        href: hint.learnMoreUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        style: {
                          color: 'var(--uptiq-training-primary, #2563eb)',
                          fontWeight: '500',
                          fontSize: '12px',
                        },
                      },
                      'Learn more →',
                    ),
                  )
                : null,
            ].filter(Boolean),
          )
        : null;
      return h(
        'span',
        {
          style: { position: 'relative', display: 'inline-block' },
          onMouseenter: () => (hovering.value = true),
          onMouseleave: () => (hovering.value = false),
        },
        [trigger, body].filter(Boolean),
      );
    };
  },
});
