import { useRef, useCallback, useEffect } from 'react';
import { OptimizedAnimation } from '../core/OptimizedAnimation';

/**
 * useOptimizedAnimation hook
 * Allows React components to safely run stutter-free animations.
 * Automatically cleans up on component unmount to prevent memory leaks.
 */
export function useOptimizedAnimation() {
  const animationRef = useRef(null);

  // Lazy initialize to avoid creating instance during renders
  const getAnimation = () => {
    if (!animationRef.current) {
      animationRef.current = new OptimizedAnimation();
    }
    return animationRef.current;
  };

  const animate = useCallback((duration, onUpdate, onComplete) => {
    getAnimation().start(duration, onUpdate, onComplete);
  }, []);

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
  }, []);

  const isAnimating = useCallback(() => {
    return animationRef.current ? animationRef.current.isAnimating() : false;
  }, []);

  // Lifecycle cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  return { animate, stop, isAnimating };
}
