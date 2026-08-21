/**
 * Theme tokens applied as CSS variables at the trainer mount point.
 *
 * Every host product ships its own Theme object. Defaults exist so the SDK
 * looks reasonable out of the box; they are not brand-correct.
 *
 * Adding a new token here is a MINOR bump — existing themes stay valid because
 * every field is optional at consumption.
 */

export interface Theme {
  /** Primary action color (Next button, progress). */
  primary?: string;
  /** Tooltip background. */
  background?: string;
  /** Tooltip text color. */
  foreground?: string;
  /** Tooltip border. */
  border?: string;
  /** Border radius on the tooltip. */
  radius?: string;
  /** Box shadow on the tooltip. */
  shadow?: string;
  /** Font family for tooltip text. */
  fontFamily?: string;
  /** Font size for the tooltip body. */
  fontSize?: string;
}

/** Neutral defaults. Not brand-correct for any product. */
export const defaultTheme: Theme = {
  primary: '#2563eb',
  background: '#ffffff',
  foreground: '#111827',
  border: '#e5e7eb',
  radius: '8px',
  shadow: '0 10px 25px rgba(0,0,0,0.1)',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '14px',
};

/**
 * the example app theme — brand tokens from design (received Sprint 07, T-063).
 * Source: the example app design system v2.4, tokens/brand.json.
 */
export const exampleAppTheme: Theme = {
  primary: '#5B4BE1', // in-app-training/violet-600
  background: '#FFFFFF', // in-app-training/neutral-0
  foreground: '#0B1220', // in-app-training/neutral-900
  border: '#E4E7EF', // in-app-training/neutral-200
  radius: '12px', // radius/md
  shadow: '0 12px 32px rgba(11, 18, 32, 0.14)', // shadow/md
  fontFamily: '"Inter Variable", "Inter", system-ui, -apple-system, sans-serif',
  fontSize: '14px',
};

/**
 * Apply a theme by writing CSS variables to a root element.
 * Called by adapters at mount time.
 */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  const merged = { ...defaultTheme, ...theme };
  const setVar = (name: string, value: string | undefined) => {
    if (value !== undefined) root.style.setProperty(`--in-app-training-${name}`, value);
  };
  setVar('primary', merged.primary);
  setVar('background', merged.background);
  setVar('foreground', merged.foreground);
  setVar('border', merged.border);
  setVar('radius', merged.radius);
  setVar('shadow', merged.shadow);
  setVar('font-family', merged.fontFamily);
  setVar('font-size', merged.fontSize);
}
