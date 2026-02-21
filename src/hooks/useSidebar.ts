import { useState, useEffect, useCallback } from 'react';

/**
 * Controls the mobile/tablet sidebar drawer.
 *
 * Pass `watchValue` (e.g. activeView) to auto-close when navigation occurs
 * — this simulates the "close on route change" behavior found in router-based apps.
 */
export function useSidebar(watchValue?: unknown) {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-close when the watched value changes (i.e. user navigated to a new view)
  useEffect(() => {
    setIsOpen(false);
  }, [watchValue]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setIsOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const open   = useCallback(() => setIsOpen(true), []);
  const close  = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(v => !v), []);

  return { isOpen, open, close, toggle };
}
