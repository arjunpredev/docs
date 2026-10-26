// Types for share-card.mjs, the pre.dev share card spec (kept identical to the original).
export interface ShareCard {
  eyebrow?: string[];
  title: string;
  dim?: string;
  text?: string;
  list?: [string, string][];
  footer?: {
    meta?: [string, string];
    stats?: [string, string][];
    chips?: string[];
    bars?: unknown;
  };
  avatar?: string;
  portrait?: boolean;
  fit?: boolean;
}

export interface CardArt {
  mark: string;
  sky: string;
  portrait?: string;
}

export interface CardFit {
  titleSize: number;
  text?: string;
  textSize?: number;
  list?: [string, string][];
  footer?: ShareCard['footer'];
}

export type CardNode = { type: string; props: Record<string, unknown> };

export declare const CARD_WIDTH: 1200;
export declare const CARD_HEIGHT: 630;
export declare const CARD_DESIGN: string;
export declare const MIN_FONT: number;
export declare const CARD_FONTS: { name: string; weight: 500 | 600 | 700 | 800; file: string }[];
export declare const MARK_SVG: string;
export declare function skySvg(): string;
export declare function svgDataUrl(svg: string): string;
export declare function plainText(text: string | undefined): string;
export declare function cardTree(card: ShareCard, art: CardArt, fit?: Partial<CardFit>): CardNode;
export declare function fitCard(card: ShareCard, satori: unknown, fonts: unknown[]): Promise<CardFit>;
export declare function checkCard(tree: CardNode): string[];
export declare function cardAlt(card: ShareCard): string;
