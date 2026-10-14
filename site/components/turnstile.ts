'use client';
// Turnstile check for Ask AI (shown only when Cloudflare needs interaction). Tokens are single use, so each
// question gets a fresh one. No-op when no site key is configured.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | undefined;
let widgetId: string | undefined;
let pending: ((token: string | undefined) => void) | undefined;

function loadScript(): Promise<TurnstileApi> {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')));
    script.onerror = () => reject(new Error('turnstile failed to load'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export async function getTurnstileToken(): Promise<string | undefined> {
  if (!SITE_KEY) return undefined;
  const turnstile = await loadScript();
  if (!widgetId) {
    // Usually invisible; if Cloudflare wants a click, the check appears here,
    // just above the Ask AI input.
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;right:16px;bottom:96px;z-index:60';
    document.body.appendChild(el);
    widgetId = turnstile.render(el, {
      sitekey: SITE_KEY,
      execution: 'execute',
      appearance: 'interaction-only',
      callback: (token: string) => pending?.(token),
      'error-callback': () => pending?.(undefined),
      'expired-callback': () => pending?.(undefined),
    });
  } else {
    turnstile.reset(widgetId);
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(undefined), 15_000);
    pending = (token) => {
      clearTimeout(timer);
      pending = undefined;
      resolve(token);
    };
    turnstile.execute(widgetId!);
  });
}
