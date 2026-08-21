/**
 * Persistence adapter — where completion state, dismissals, and other durable
 * per-user data live.
 *
 * Default: localStorage. Enterprise products can swap in a backend adapter for
 * cross-device sync. Async on the interface from the start so switching to a
 * networked backend doesn't require API changes. See ADR-0004.
 */

export interface Persistence {
  get(key: string): Promise<unknown | undefined>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
  /**
   * Sprint 12 (ADR-0005). Clear every key in the SDK's namespace. Optional
   * for backwards compat; `Trainer.forgetUser` uses this when present.
   */
  clearAll?(): Promise<void>;
}

const KEY_PREFIX = 'in-app-training';

/**
 * Wrap localStorage. Falls back to in-memory if localStorage is unavailable
 * (private mode, disabled by policy, SSR).
 */
export function localStoragePersistence(): Persistence {
  const available = isLocalStorageAvailable();
  if (!available) {
    // eslint-disable-next-line no-console
    console.warn(
      '[in-app-training] localStorage unavailable, falling back to in-memory persistence',
    );
    return memoryPersistence();
  }

  return {
    async get(key) {
      const raw = window.localStorage.getItem(fullKey(key));
      if (raw === null) return undefined;
      try {
        return JSON.parse(raw);
      } catch {
        // Corrupted entry — drop it and return undefined.
        window.localStorage.removeItem(fullKey(key));
        return undefined;
      }
    },
    async set(key, value) {
      window.localStorage.setItem(fullKey(key), JSON.stringify(value));
    },
    async remove(key) {
      window.localStorage.removeItem(fullKey(key));
    },
    async clearAll() {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(`${KEY_PREFIX}:`)) keys.push(k);
      }
      for (const k of keys) window.localStorage.removeItem(k);
    },
  };
}

/**
 * In-memory adapter. Useful for tests, SSR, and as a fallback.
 * State is lost on reload.
 */
export function memoryPersistence(): Persistence {
  const store = new Map<string, unknown>();
  return {
    async get(key) {
      return store.get(key);
    },
    async set(key, value) {
      store.set(key, value);
    },
    async remove(key) {
      store.delete(key);
    },
    async clearAll() {
      store.clear();
    },
  };
}

function fullKey(key: string): string {
  return `${KEY_PREFIX}:${key}`;
}

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probe = `${KEY_PREFIX}:__probe__`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
