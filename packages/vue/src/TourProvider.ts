/**
 * TourProvider — mount once at the app root.
 *
 * Provides the Trainer to descendants via provide/inject and applies the theme's
 * CSS variables to the theme root on mount. Vue equivalent of the React adapter's
 * <TourProvider>.
 *
 * Usage:
 *   <TourProvider :trainer="trainer" :theme="exampleAppTheme">
 *     <App />
 *   </TourProvider>
 */
import { defineComponent, h, onMounted, watch, type PropType } from 'vue';
import type { Trainer, Theme } from '@in-app-training/sdk';
import { applyTheme } from '@in-app-training/sdk';
import { TrainerKey } from './inject-keys.js';

export const TourProvider = defineComponent({
  name: 'TourProvider',
  props: {
    trainer: { type: Object as PropType<Trainer>, required: true },
    theme: { type: Object as PropType<Theme>, required: false },
    themeRoot: { type: Object as PropType<HTMLElement>, required: false },
  },
  setup(props, { slots }) {
    if (!props.trainer) {
      throw new Error(
        '<TourProvider> requires a `trainer` prop. Construct a Trainer instance and pass it in.',
      );
    }

    // provide is set up during setup; consumers using inject() will see it.
    // We can't use the composition API `provide()` here without importing it separately.
    // Use the imported one from `vue`:
    // (imported below as a named import for cleanliness)
    provideTrainer(props.trainer);

    const applyCurrent = (): void => {
      if (!props.theme) return;
      if (typeof document === 'undefined') return;
      applyTheme(props.theme, props.themeRoot ?? document.documentElement);
    };
    onMounted(applyCurrent);
    watch(() => [props.theme, props.themeRoot], applyCurrent, { deep: false });

    return () => h('div', { 'data-in-app-training-provider': '' }, slots.default?.());
  },
});

// Split the provide call into a helper so the test file can import + verify.
import { provide } from 'vue';
function provideTrainer(trainer: Trainer): void {
  provide(TrainerKey, trainer);
}
