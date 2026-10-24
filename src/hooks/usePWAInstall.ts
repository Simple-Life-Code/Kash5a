import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global window declaration for early event interception matching Retaj-Today
declare global {
  interface Window {
    __retajDeferredPrompt?: BeforeInstallPromptEvent | null;
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    const promptEvent = e as BeforeInstallPromptEvent;
    window.__retajDeferredPrompt = promptEvent;
    window.__deferredPwaPrompt = promptEvent;
    window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
  });
}

export type InstallStatus = 'idle' | 'installing' | 'installed' | 'dismissed';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined') {
      return window.__retajDeferredPrompt || window.__deferredPwaPrompt || null;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [justInstalled, setJustInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);
  const [installStatus, setInstallStatus] = useState<InstallStatus>('idle');

  useEffect(() => {
    // 1. Check if running inside iframe
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    setIsInIframe(inIframe);

    // 2. Check if already in standalone/PWA mode (Phone Home Screen or Desktop App)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      setInstallStatus('installed');
    }

    // 3. Detect User Agent
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // 4. Capture prompt handlers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__retajDeferredPrompt = promptEvent;
      window.__deferredPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handlePromptAvailable = () => {
      const promptEvent = window.__retajDeferredPrompt || window.__deferredPwaPrompt;
      if (promptEvent) {
        setDeferredPrompt(promptEvent);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setJustInstalled(true);
      setInstallStatus('installed');
      window.__retajDeferredPrompt = null;
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.__retajDeferredPrompt || window.__deferredPwaPrompt) {
      setDeferredPrompt(window.__retajDeferredPrompt || window.__deferredPwaPrompt || null);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Direct Installation Engine: Triggers immediate native prompt without any secondary guide windows
  const install = useCallback(async (): Promise<{ success: boolean; reason?: string }> => {
    if (isInstalled || installStatus === 'installed') {
      return { success: true, reason: 'already_installed' };
    }

    let promptToUse = deferredPrompt || window.__retajDeferredPrompt || window.__deferredPwaPrompt;

    // Grace period check for freshly dispatched prompt event
    if (!promptToUse) {
      promptToUse = await new Promise<BeforeInstallPromptEvent | null>((resolve) => {
        const timer = setTimeout(() => resolve(window.__retajDeferredPrompt || window.__deferredPwaPrompt || null), 500);
        const onAvailable = () => {
          clearTimeout(timer);
          window.removeEventListener('pwa-prompt-available', onAvailable);
          resolve(window.__retajDeferredPrompt || window.__deferredPwaPrompt || null);
        };
        window.addEventListener('pwa-prompt-available', onAvailable, { once: true });
      });
    }

    if (promptToUse) {
      setInstallStatus('installing');
      try {
        await promptToUse.prompt();
        const choice = await promptToUse.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          setJustInstalled(true);
          setDeferredPrompt(null);
          window.__retajDeferredPrompt = null;
          window.__deferredPwaPrompt = null;
          setInstallStatus('installed');
          return { success: true, reason: 'installed' };
        } else {
          setInstallStatus('idle');
          return { success: false, reason: 'dismissed' };
        }
      } catch (err) {
        console.warn('Direct installation error:', err);
        setInstallStatus('idle');
        return { success: false, reason: 'prompt_failed' };
      }
    }

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true) {
      setIsInstalled(true);
      setJustInstalled(true);
      setInstallStatus('installed');
      return { success: true, reason: 'already_installed' };
    }

    return { success: false, reason: 'not_ready' };
  }, [deferredPrompt, isInstalled, installStatus]);

  return {
    isInstallable: !!(deferredPrompt || (typeof window !== 'undefined' && (window.__retajDeferredPrompt || window.__deferredPwaPrompt))),
    isInstalled: isInstalled || installStatus === 'installed',
    justInstalled,
    isIOS,
    isAndroid,
    isInIframe,
    installStatus,
    install,
    triggerDirectInstall: install,
    deferredPrompt,
  };
}
