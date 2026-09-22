import { ReactNode, useEffect, useRef, useState } from 'react';

interface Props {
  children: ReactNode;
  placeholderHeight?: number;
}

export function ObservableCard({ children, placeholderHeight = 220 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (hasEntered) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasEntered]);

  return (
    <div ref={containerRef} style={hasEntered ? undefined : { minHeight: placeholderHeight }}>
      {hasEntered ? children : null}
    </div>
  );
}
