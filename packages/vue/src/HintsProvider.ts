/**
 * HintsProvider — provides hint content to descendants for <TrainingHint>.
 *
 * Vue counterpart of the React HintsProvider.
 */
import { defineComponent, provide, computed, type PropType } from 'vue';
import type { HintsFile, Hint } from '@in-app-training/sdk';
import { HintsKey } from './inject-keys.js';

export const HintsProvider = defineComponent({
  name: 'HintsProvider',
  props: {
    hints: { type: Object as PropType<HintsFile>, required: true },
  },
  setup(props, { slots }) {
    const hintsById = computed(() => {
      const map = new Map<string, Hint>();
      for (const hint of props.hints.hints) map.set(hint.id, hint);
      return map;
    });
    provide(HintsKey, {
      // computed unwraps in inject usage via `.value` at read time; wrap to keep interface simple.
      get hintsById() {
        return hintsById.value;
      },
    });
    return () => slots.default?.();
  },
});
