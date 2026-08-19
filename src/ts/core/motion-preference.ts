const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Read the user's current motion preference.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Observe changes to the user's motion preference and return a cleanup.
 */
export function onMotionPreferenceChange(callback: (reduced: boolean) => void): () => void {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  const listener = (event: MediaQueryListEvent): void => {
    callback(event.matches);
  };

  mediaQuery.addEventListener('change', listener);

  return (): void => {
    mediaQuery.removeEventListener('change', listener);
  };
}
