/**
 * <FirstRunTour tour-id="..." /> — declarative first-run auto-start. Renders nothing.
 * Vue counterpart of the React component.
 */
import { defineComponent, onMounted, onBeforeUnmount, type PropType } from 'vue';
import { useTour } from './useTour.js';
import { useTourProgress } from './useTourProgress.js';

export const FirstRunTour = defineComponent({
  name: 'FirstRunTour',
  props: {
    tourId: { type: String as PropType<string>, required: true },
    delayMs: { type: Number as PropType<number>, default: 0 },
  },
  setup(props) {
    const { start } = useTour();
    const progress = useTourProgress(props.tourId);
    let handle: ReturnType<typeof setTimeout> | null = null;

    onMounted(() => {
      if (progress.value.status !== 'not-started') return;
      if (props.delayMs === 0) {
        void start(props.tourId, 'first-run');
      } else {
        handle = setTimeout(() => {
          void start(props.tourId, 'first-run');
        }, props.delayMs);
      }
    });

    onBeforeUnmount(() => {
      if (handle) clearTimeout(handle);
    });

    return () => null;
  },
});
