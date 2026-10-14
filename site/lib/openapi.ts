import fs from 'node:fs';
import path from 'node:path';
import { openapiFiles, repoRoot } from './docs-config';

export interface OpenAPIRef {
  document: string;
  method: string;
  path: string;
}

/** Parses Mintlify's `openapi: "/api-reference/openapi.json GET /path"` frontmatter. */
export function parseOpenAPIRef(value: string): OpenAPIRef {
  const parts = value.trim().split(/\s+/);
  if (parts.length !== 3) throw new Error(`Unsupported openapi frontmatter: "${value}"`);
  const [file, method, route] = parts;
  const document = file.replace(/^\/+/, '');
  if (!openapiFiles().includes(document)) throw new Error(`openapi frontmatter points at ${document}, which docs.json does not list`);
  return { document, method: method.toLowerCase(), path: route };
}

type Spec = Record<string, any>;

const specCache = new Map<string, Spec>();

/** The raw spec file as written (refs intact). */
export function readSpec(document: string): Spec {
  let spec = specCache.get(document);
  if (!spec) {
    spec = JSON.parse(fs.readFileSync(path.join(repoRoot, document), 'utf8')) as Spec;
    specCache.set(document, spec);
  }
  return spec;
}

/** A copy of `spec` holding one operation and only the components it references. */
export function extractOperation(spec: Spec, ref: Pick<OpenAPIRef, 'path' | 'method'>): Spec {
  const pathItem = spec.paths?.[ref.path];
  const operation = pathItem?.[ref.method];
  if (!operation) throw new Error(`${ref.method.toUpperCase()} ${ref.path}: operation not found`);

  // Breadth-first, so components appear in the order Mintlify listed them
  const components: Record<string, Record<string, unknown>> = {};
  const seen = new Set<string>();
  const refsIn = (node: unknown, found: string[] = []): string[] => {
    if (Array.isArray(node)) node.forEach((child) => refsIn(child, found));
    else if (node && typeof node === 'object') {
      for (const [key, child] of Object.entries(node)) {
        if (key === '$ref' && typeof child === 'string') found.push(child);
        else refsIn(child, found);
      }
    }
    return found;
  };
  let queue = refsIn([pathItem.parameters, operation]);
  while (queue.length > 0) {
    const next: string[] = [];
    for (const ref of queue) {
      if (!ref.startsWith('#/components/') || seen.has(ref)) continue;
      seen.add(ref);
      const [, , kind, name] = ref.split('/');
      const target = spec.components?.[kind]?.[name];
      if (!target) continue;
      (components[kind] ??= {})[name] = target;
      next.push(...refsIn(target));
    }
    queue = next;
  }
  for (const requirement of operation.security ?? spec.security ?? []) {
    for (const name of Object.keys(requirement)) {
      const scheme = spec.components?.securitySchemes?.[name];
      if (scheme) (components.securitySchemes ??= {})[name] = scheme;
    }
  }

  const extract: Spec = {
    openapi: spec.openapi,
    info: spec.info,
    servers: spec.servers,
    security: spec.security,
    tags: spec.tags,
    paths: { [ref.path]: { ...(pathItem.parameters ? { parameters: pathItem.parameters } : {}), [ref.method]: operation } },
  };
  if (Object.keys(components).length > 0) extract.components = components;
  for (const key of Object.keys(extract)) if (extract[key] === undefined) delete extract[key];
  return extract;
}
