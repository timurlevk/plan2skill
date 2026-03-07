// ─── Structured Content Blocks ──────────────────────────────────

export type ContentBlockType = 'text' | 'code' | 'callout' | 'interactive' | 'deep_lore';

export interface TextBlock {
  type: 'text';
  heading?: string;
  body: string;
}

export interface CodeBlock {
  type: 'code';
  language: string;
  code: string;
  caption?: string;
}

export interface CalloutBlock {
  type: 'callout';
  variant: 'tip' | 'warning' | 'info' | 'lore';
  title: string;
  body: string;
}

export interface InteractiveBlock {
  type: 'interactive';
  prompt: string;
  answer: string;
  hint?: string;
}

export interface DeepLoreBlock {
  type: 'deep_lore';
  title: string;
  body: string;
}

export type ContentBlock =
  | TextBlock
  | CodeBlock
  | CalloutBlock
  | InteractiveBlock
  | DeepLoreBlock;
