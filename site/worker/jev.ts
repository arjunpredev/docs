// Jev, TypeSafe's decision model. It answers typed questions about one state
// with probabilities in a single forward pass and never writes text, so a call
// bills input tokens only and takes about 0.3 s. Its answers are not
// deterministic (the same input can move a probability by a few points), so
// callers threshold with a margin.
// Never throws: any failure returns null and the caller carries on without it.
const JEV_URL = 'https://api.typesafe.ai/v1/systemone';

export type JevQuestion =
  | { type: 'noul'; instructions: string }
  | { type: 'choice'; instructions: string; criteria: Record<string, string> };

export interface JevAnswer {
  /** noul: probability the statement is true, 0 to 1 */
  noul?: number;
  choice?: string;
  probabilities?: Record<string, number>;
}

export interface JevResult {
  answers: Record<string, JevAnswer>;
  inputTokens: number;
  /** As reported by the provider, when it reports one */
  cost?: number;
  ms: number;
}

export async function askJev(
  key: string,
  model: string,
  state: unknown,
  questions: Record<string, JevQuestion>,
  timeoutMs = 2500,
): Promise<JevResult | null> {
  const started = Date.now();
  try {
    const res = await fetch(JEV_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, state, questions }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      console.warn('jev error', res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const body = (await res.json()) as { answers?: Record<string, JevAnswer>; usage?: { input_tokens?: number; cost?: number } };
    if (!body.answers || typeof body.answers !== 'object') return null;
    const cost = Number(body.usage?.cost);
    return {
      answers: body.answers,
      inputTokens: Number(body.usage?.input_tokens) || 0,
      cost: Number.isFinite(cost) ? cost : undefined,
      ms: Date.now() - started,
    };
  } catch (error) {
    console.warn('jev failed', error instanceof Error ? error.message : error);
    return null;
  }
}
