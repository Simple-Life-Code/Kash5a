import { useEffect, useRef } from 'react';

// Global stack of active modal closers
const modalClosersStack: (() => void)[] = [];

/**
 * Register an active modal closer.
 * Pushes a history state so phone back button closes the modal.
 * Returns cleanup function.
 */
export function registerGlobalModal(onClose: () => void): () => void {
  modalClosersStack.push(onClose);
  if (typeof window !== 'undefined') {
    try {
      window.history.pushState({ modalOpen: true }, '');
    } catch {}
  }

  return () => {
    const idx = modalClosersStack.lastIndexOf(onClose);
    if (idx !== -1) {
      modalClosersStack.splice(idx, 1);
    }
  };
}

/**
 * Global navigation hook handling:
 * 1. Warning message before closing or reloading the platform (beforeunload)
 * 2. Hardware / Browser Back Button on mobile phones (popstate)
 * 3. Escape key (Esc) on laptops and keyboards
 */
export function useGlobalNavigation(
  activeTab: string,
  setActiveTab: (tab: any) => void
) {
  const tabHistoryRef = useRef<string[]>(['dashboard']);

  // Track tab history
  useEffect(() => {
    const history = tabHistoryRef.current;
    if (history[history.length - 1] !== activeTab) {
      history.push(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    // 1. Warning before closing or reloading platform
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      const warningText = 'هل أنت متأكد من مغادرة وإغلاق منصة كشخة فاشنز؟ قد تفقد التغييرات غير المحفوظة.';
      e.returnValue = warningText;
      return warningText;
    };

    // 2. Mobile hardware / browser back button
    const handlePopState = (e: PopStateEvent) => {
      if (modalClosersStack.length > 0) {
        const closeTopModal = modalClosersStack.pop();
        closeTopModal?.();
      } else {
        const history = tabHistoryRef.current;
        if (history.length > 1) {
          history.pop(); // remove current
          const previousTab = history[history.length - 1] || 'dashboard';
          setActiveTab(previousTab);
        } else if (activeTab !== 'dashboard') {
          setActiveTab('dashboard');
        }
      }
    };

    // 3. Escape key from laptop / desktop keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalClosersStack.length > 0) {
          const closeTopModal = modalClosersStack.pop();
          closeTopModal?.();
        } else if (activeTab !== 'dashboard') {
          setActiveTab('dashboard');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, setActiveTab]);
}
