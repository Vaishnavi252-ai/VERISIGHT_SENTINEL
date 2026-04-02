import { useEffect } from 'react';

/**
 * Adds .is-visible to elements with [data-scroll-reveal] when they enter the viewport.
 * Call this hook once in a top-level component (e.g. App).
 */
export default function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback: make all visible
      document.querySelectorAll('[data-scroll-reveal]').forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          const el = entry.target;
          if (entry.isIntersecting) {
            el.classList.add('is-visible');
            // If you want repeat animations, remove the next line
            obs.unobserve(el);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -10% 0px', // trigger slightly before element fully in view
        threshold: 0.15,
      }
    );

    const nodes = document.querySelectorAll('[data-scroll-reveal]');
    nodes.forEach(n => observer.observe(n));

    return () => {
      observer.disconnect();
    };
  }, []);
}