// Theme tokens — ported from src/theme.js. Produces a CSS variable block that
// the shell injects into a <style> tag.

import type { Density } from './types';

const ACCENTS = {
  '#1976d2': { main: '#1976d2', dark: '#0f5cab', soft: 'rgba(25,118,210,0.10)', softHover: 'rgba(25,118,210,0.16)', on: '#ffffff' },
  '#111827': { main: '#111827', dark: '#000000', soft: 'rgba(17,24,39,0.08)', softHover: 'rgba(17,24,39,0.14)', on: '#ffffff' },
  '#7c3aed': { main: '#7c3aed', dark: '#5b21b6', soft: 'rgba(124,58,237,0.10)', softHover: 'rgba(124,58,237,0.18)', on: '#ffffff' },
  '#10b981': { main: '#10b981', dark: '#047857', soft: 'rgba(16,185,129,0.10)', softHover: 'rgba(16,185,129,0.18)', on: '#062b1f' },
  '#f97316': { main: '#f97316', dark: '#c2410c', soft: 'rgba(249,115,22,0.10)', softHover: 'rgba(249,115,22,0.18)', on: '#2a1505' },
  '#e11d48': { main: '#e11d48', dark: '#9f1239', soft: 'rgba(225,29,72,0.10)', softHover: 'rgba(225,29,72,0.18)', on: '#ffffff' },
} as const;

type AccentKey = keyof typeof ACCENTS;

const FONT_STACKS: Record<string, string> = {
  Inter: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  Geist: "'Geist', 'Inter', system-ui, sans-serif",
  'IBM Plex Sans': "'IBM Plex Sans', system-ui, sans-serif",
  System: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

export type ThemeTokens = {
  accent: AccentKey | string;
  fontFamily: string;
  density: Density;
  dark: boolean;
};

export function getThemeStyles({ accent, fontFamily, density, dark }: ThemeTokens): string {
  const a = ACCENTS[(accent as AccentKey)] ?? ACCENTS['#1976d2'];
  const rowH = density === 'compact' ? 48 : density === 'spacious' ? 88 : 68;
  const rowPad = density === 'compact' ? 8 : density === 'spacious' ? 16 : 12;
  const fontStack = FONT_STACKS[fontFamily] ?? FONT_STACKS.Inter;

  const palette = dark
    ? `
        --bg: #0e1116;
        --bg-elevated: #161b22;
        --bg-hover: rgba(255,255,255,0.04);
        --bg-active: rgba(255,255,255,0.07);
        --surface: #161b22;
        --surface-2: #1c222b;
        --border: rgba(255,255,255,0.08);
        --border-strong: rgba(255,255,255,0.14);
        --text: #e6edf3;
        --text-secondary: #9ba8b5;
        --text-tertiary: #6e7c8c;
        --shadow-1: 0 1px 2px rgba(0,0,0,0.5), 0 1px 1px rgba(0,0,0,0.4);
        --shadow-2: 0 4px 16px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3);
        --shadow-3: 0 24px 48px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.4);
      `
    : `
        --bg: #f6f7f9;
        --bg-elevated: #ffffff;
        --bg-hover: rgba(15,20,30,0.04);
        --bg-active: rgba(15,20,30,0.06);
        --surface: #ffffff;
        --surface-2: #f3f5f8;
        --border: rgba(15,20,30,0.08);
        --border-strong: rgba(15,20,30,0.14);
        --text: #11161e;
        --text-secondary: #555f6d;
        --text-tertiary: #8a94a1;
      `;

  return `
    :root {
      color-scheme: ${dark ? 'dark' : 'light'};
      --accent: ${a.main};
      --accent-dark: ${a.dark};
      --accent-soft: ${a.soft};
      --accent-soft-hover: ${a.softHover};
      --accent-on: ${a.on};
      --row-h: ${rowH}px;
      --row-pad: ${rowPad}px;
      --font: ${fontStack};
      --font-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      --radius-sm: 6px;
      --radius: 10px;
      --radius-lg: 14px;
      --shadow-1: 0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.03);
      --shadow-2: 0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
      --shadow-3: 0 20px 48px rgba(0,0,0,0.18), 0 8px 16px rgba(0,0,0,0.10);
      ${palette}
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; }
    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      font-size: 14px;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      font-feature-settings: 'cv11', 'ss01';
    }
    button { font-family: inherit; }
    input, textarea, select { font-family: inherit; color: inherit; }
    *:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }

    *::-webkit-scrollbar { width: 10px; height: 10px; }
    *::-webkit-scrollbar-track { background: transparent; }
    *::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 10px; border: 2px solid var(--bg); }
    *::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
  `;
}
