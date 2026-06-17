import { useState, useEffect } from 'react';

/**
 * useDeviceDetection hook
 * Detects mobile vs desktop based on window width and user agent.
 * Automatically toggles graphic quality suggestions.
 */
export function useDeviceDetection() {
  const [device, setDevice] = useState('desktop');
  const [quality, setQuality] = useState('high');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      // standard mobile breakpoint of 768px or user-agent detection
      const isMobile = width <= 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      
      setDevice(isMobile ? 'mobile' : 'desktop');
      setQuality(isMobile ? 'low' : 'high');
    };

    // Run on mount
    checkDevice();

    // Listen to resize events
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { device, quality };
}
