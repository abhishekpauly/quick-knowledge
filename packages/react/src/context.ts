/**
 * TrainerContext — React context holding the Trainer instance.
 *
 * Consumers never use this directly — they use the hooks. Kept internal so we
 * can change the context shape (e.g., add derived state) without breaking users.
 */
import { createContext } from 'react';
import type { Trainer } from '@in-app-training/sdk';

export const TrainerContext = createContext<Trainer | null>(null);
TrainerContext.displayName = 'TrainerContext';
