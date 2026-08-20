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
 * Placeholder theme for AI Platform. Curriculum + design will refine in Sprint 02.
 * These values are stubs; swap for real brand tokens before shipping.
 */
export const aiPlatformTheme: Theme = {
  primary: '#4f46e5', // stub
  background: '#ffffff',
  foreground: '#0f172a',
  border: '#e2e8f0',
  radius: '10px',
  shadow: '0 10px 25px rgba(15,23,42,0.12)',
  fontFamily: '"Inter", system-ui, sans-serif',
  fontSize: '14px',
};

/**
 * Apply a theme by writing CSS variables to a root element.
 * Called by adapters at mount time.
 */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  const merged = { ...defaultTheme, ...theme };
  const setVar = (name: string, value: string | undefined) => {
    if (value !== undefined) root.style.setProperty(`--uptiq-training-${name}`, value);
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
