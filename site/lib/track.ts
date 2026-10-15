// PostHog, loaded only on docs.pre.dev and only after the page is interactive,
// so other hosts never download it and it stays off the critical path.
type PostHog = (typeof import('posthog-js'))['default'];

let client: Promise<PostHog | undefined> | undefined;

export function initAnalytics(apiKey: string, apiHost?: string) {
  client ??= import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(apiKey, {
        api_host: apiHost ?? 'https://us.i.posthog.com',
        capture_pageview: 'history_change',
        disable_session_recording: true,
        // the docs run no surveys; this skips a 33 KB script
        disable_surveys: true,
        persistence: 'localStorage+cookie',
      });
      return posthog;
    })
    .catch(() => undefined);
}

export function track(event: string, properties?: Record<string, unknown>) {
  void client?.then((posthog) => posthog?.capture(event, properties));
}
