// Pure helpers ported from src/data.js — initials/avatar colors, time formatting,
// alias palette, alias resolution.

export const DOMAIN = 'hax429.me';

export type Alias = {
  local: string;
  label: string;
  hint: string;
  hue: number;
};

export const ALIASES: Alias[] = [
  { local: 'gabriel', label: 'Gabriel', hint: 'Personal', hue: 250 },
  { local: 'me', label: 'Me', hint: 'Quick personal', hue: 30 },
  { local: 'no-reply', label: 'No-reply', hint: 'Automated / system', hue: 220 },
  { local: 'info', label: 'Info', hint: 'Newsletters, info', hue: 150 },
  { local: 'admin', label: 'Admin', hint: 'Account & services', hue: 320 },
];

const AVATAR_COLORS = [
  { bg: 'oklch(70% 0.14 250)', fg: '#0b1d35' },
  { bg: 'oklch(72% 0.14 30)', fg: '#3a1502' },
  { bg: 'oklch(74% 0.13 150)', fg: '#062417' },
  { bg: 'oklch(72% 0.14 320)', fg: '#2d0a26' },
  { bg: 'oklch(74% 0.14 200)', fg: '#062533' },
  { bg: 'oklch(76% 0.13 90)', fg: '#27240a' },
  { bg: 'oklch(70% 0.14 280)', fg: '#1b0a36' },
];

export function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function getInitials(nameOrEmail: string): string {
  const name = nameOrEmail.split('@')[0].replace(/[._-]+/g, ' ').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Fixed "now" for deterministic relative time in prototype mode.
// In production we want the real current time.
function nowMs(): number {
  return Date.now();
}

export function formatRelativeTime(iso: string): string {
  const now = nowMs();
  const t = new Date(iso).getTime();
  const diff = now - t;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatFullTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getAlias(addr?: string | null): Alias | null {
  if (!addr) return null;
  const local = String(addr).split('@')[0].toLowerCase().trim();
  return ALIASES.find((a) => a.local === local) ?? null;
}

export type AliasColors = {
  bg: string;
  fg: string;
  dot: string;
  bgDark: string;
  fgDark: string;
};

export function aliasColors(addr?: string | null): AliasColors {
  const a = getAlias(addr);
  if (a) {
    return {
      bg: `oklch(92% 0.04 ${a.hue})`,
      fg: `oklch(38% 0.12 ${a.hue})`,
      dot: `oklch(60% 0.14 ${a.hue})`,
      bgDark: `oklch(28% 0.06 ${a.hue})`,
      fgDark: `oklch(82% 0.10 ${a.hue})`,
    };
  }
  return {
    bg: 'var(--surface-2)',
    fg: 'var(--text-secondary)',
    dot: 'var(--text-tertiary)',
    bgDark: 'var(--surface-2)',
    fgDark: 'var(--text-secondary)',
  };
}

// "Linear <updates@linear.app>" → { name: "Linear", email: "updates@linear.app" }
export function parseAddress(addr: string): { name: string | null; email: string } {
  const m = addr.match(/^\s*"?([^"<]+?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: null, email: addr.trim() };
}

export function snippetFrom(textOrHtml: string | null): string {
  if (!textOrHtml) return '';
  const stripped = textOrHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.slice(0, 180);
}
