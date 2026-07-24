import { useEffect, useRef, useState } from 'react';

/**
 * Returns a ref to attach to a DOM element and whether it has ever entered
 * the viewport. Initialises synchronously (no async delay) for elements
 * already in the viewport on mount, then watches via IntersectionObserver
 * for elements that scroll into view later.
 */
export function useInViewport(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);

  // Check synchronously on first render — if the element is already in
  // the viewport we don't want to wait for the async observer callback.
  const [hasBeenVisible, setHasBeenVisible] = useState(() => {
    // During SSR or before mount, ref.current is null — default to false
    return false;
  });

  useEffect(() => {
    if (hasBeenVisible) return;
    const el = ref.current;
    if (!el) return;

    // Synchronous check — if already in viewport, mark immediately
    const rect = el.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight + 200 && rect.bottom > -200;
    if (inViewport) {
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasBeenVisible]);

  return [ref, hasBeenVisible];
}
