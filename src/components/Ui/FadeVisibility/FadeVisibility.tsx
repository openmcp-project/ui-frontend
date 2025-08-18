import React, { useState, useEffect, ReactNode } from 'react';

interface FadeVisibilityProps {
  show: boolean;
  children: ReactNode;
}

const FadeVisibility: React.FC<FadeVisibilityProps> = ({ show, children }) => {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      // Mount immediately and fade in
      setMounted(true);
      // Use a small delay to allow the transition to trigger
      setTimeout(() => setVisible(true), 10);
    } else {
      // Fade out first
      setVisible(false);
      // Unmount after transition duration
      const timer = setTimeout(() => setMounted(false), 300); // Assuming 0.3s transition
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.15s  ease-in-out',
      }}
    >
      {children}
    </div>
  );
};

export default FadeVisibility;
