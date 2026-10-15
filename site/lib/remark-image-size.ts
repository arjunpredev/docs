// Gives every <img> with a local src its intrinsic width and height (from the
// SVG viewBox or the PNG header), so the browser reserves its space before it
// loads, plus loading="lazy" and decoding="async". A lazy image that is hidden
// (the other theme's half of a diagram pair) is never fetched.
import fs from 'node:fs';
import path from 'node:path';
import type { Root } from 'mdast';
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx';
import { visit } from 'unist-util-visit';

function imageSize(file: string): { width: number; height: number } | undefined {
  if (!fs.existsSync(file)) return undefined;
  if (file.endsWith('.svg')) {
    const head = fs.readFileSync(file, 'utf8').slice(0, 2000);
    const box = head.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/);
    if (box) return { width: Math.round(Number(box[1])), height: Math.round(Number(box[2])) };
    const width = head.match(/<svg[^>]*\swidth="([\d.]+)"/)?.[1];
    const height = head.match(/<svg[^>]*\sheight="([\d.]+)"/)?.[1];
    return width && height ? { width: Math.round(Number(width)), height: Math.round(Number(height)) } : undefined;
  }
  if (file.endsWith('.png')) {
    const header = Buffer.alloc(24);
    const fd = fs.openSync(file, 'r');
    fs.readSync(fd, header, 0, 24, 0);
    fs.closeSync(fd);
    return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
  }
  return undefined;
}

export function remarkImageSize({ root }: { root: string }) {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;
      const element = node as MdxJsxFlowElement | MdxJsxTextElement;
      if (element.name !== 'img') return;
      const attrs = element.attributes.filter((a): a is MdxJsxAttribute => a.type === 'mdxJsxAttribute');
      const has = (name: string) => attrs.some((a) => a.name === name);
      const add = (name: string, value: string) => {
        if (!has(name)) element.attributes.push({ type: 'mdxJsxAttribute', name, value });
      };
      const src = attrs.find((a) => a.name === 'src')?.value;
      if (typeof src !== 'string' || !src.startsWith('/')) return;
      const size = imageSize(path.join(root, decodeURI(src.split('?')[0])));
      if (size) {
        add('width', String(size.width));
        add('height', String(size.height));
      }
      add('loading', 'lazy');
      add('decoding', 'async');
    });
  };
}
