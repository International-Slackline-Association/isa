import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type ManualSteps = 'safari' | 'safariMenu' | 'chromeIos' | 'edgeIos' | 'firefoxIos' | 'firefoxAndroid';

let deferredPrompt: BeforeInstallPromptEvent | undefined;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

// Fires once per page load, often before React mounts, so it is caught at module load.
window.addEventListener('beforeinstallprompt', (event) => {
  // Keeps Chrome's own install bar away; the panel and the sign-in hint offer it instead.
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
  notify();
});
window.addEventListener('appinstalled', () => {
  deferredPrompt = undefined;
  notify();
});

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const isInstalledApp =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// Browsers without an install API; they add to the home screen only from their own menu.
const manualSteps = ((): ManualSteps | undefined => {
  const ua = navigator.userAgent;
  // iPadOS asks for the desktop site and reports itself as a Mac.
  const isIos = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (isIos) {
    if (/CriOS/.test(ua)) return 'chromeIos';
    if (/FxiOS/.test(ua)) return 'firefoxIos';
    if (/EdgiOS/.test(ua)) return 'edgeIos';
    // In-app browsers (Instagram, Facebook, …) carry no Safari version and cannot add to the home screen.
    const safariVersion = /Version\/(\d+).*Safari\//.exec(ua)?.[1];
    if (!safariVersion) return undefined;
    return Number(safariVersion) >= 26 ? 'safariMenu' : 'safari';
  }
  if (/Android/.test(ua) && /Firefox\//.test(ua)) return 'firefoxAndroid';
  return undefined;
})();

export type InstallWay = { kind: 'prompt'; prompt: () => void } | { kind: 'steps'; steps: ManualSteps };

export const useInstallWay = (): InstallWay | undefined => {
  const prompt = useSyncExternalStore(subscribe, () => deferredPrompt);
  if (isInstalledApp) return undefined;
  if (prompt) {
    return {
      kind: 'prompt',
      prompt: () => {
        // A prompt event can be used only once.
        deferredPrompt = undefined;
        notify();
        prompt.prompt().catch((error) => console.warn('Install prompt failed', error));
      },
    };
  }
  return manualSteps && { kind: 'steps', steps: manualSteps };
};
