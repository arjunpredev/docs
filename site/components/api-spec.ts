// The copy of an operation's spec that the interactive API page renders.
// An object schema can carry an anyOf/oneOf whose variants only add `required`
// rules (Task: "instruction or output"). The page's form reads that as a union
// of untyped variants and shows "unknown" with an [object Object] input, so the
// UI copy drops those rule-only unions; the schema's description states the
// rule, and the .md and MCP copies keep the spec as written.

type Node = Record<string, unknown>;

const RULE_KEYS = new Set(['required', 'properties', 'minProperties', 'maxProperties', 'not', 'description', 'title']);

function isRuleOnly(variant: unknown): boolean {
  return Boolean(variant) && typeof variant === 'object' && !Array.isArray(variant) && Object.keys(variant as Node).every((key) => RULE_KEYS.has(key));
}

function visit(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(visit);
    return;
  }
  if (!node || typeof node !== 'object') return;
  const schema = node as Node;
  if (schema.properties) {
    for (const key of ['anyOf', 'oneOf']) {
      const variants = schema[key];
      if (Array.isArray(variants) && variants.length > 0 && variants.every(isRuleOnly)) delete schema[key];
    }
  }
  for (const [key, child] of Object.entries(schema)) {
    // example values can hold JSON Schema documents of their own
    if (key === 'example' || key === 'examples' || key === 'x-codeSamples') continue;
    visit(child);
  }
}

export function forInteractivePage<T>(spec: T): T {
  const copy = structuredClone(spec);
  visit(copy);
  return copy;
}
