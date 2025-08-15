import { signal, type Signal } from 'deps';
import type { View } from './views/types.ts';
import { DEFAULT_VIEW } from './views/types.ts';

/** Global view signal used for TUI routing. */
export const currentView: Signal<View> = signal<View>(DEFAULT_VIEW);

/** Navigate to a target view. */
export function navigate(to: View): void {
  currentView.value = to;
}
