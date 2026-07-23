import { useEffect, useRef, useState } from 'react';

/**
 * Returns a ref to attach to a DOM element and whether it has ever entered
 * the viewport. Once true it stays true — we never unmount hooks for
 * off-screen tiles, we just defer the initial fetch until first visibility.
 */
export function useInViewport(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (hasBeenVisible) return;
    const el = ref.current;
    if (!el) return;

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
