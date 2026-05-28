'use client';

// Single-file port of the Webmail split-pane prototype.
// Contains: shell + sidebar + email list + reader + compose + alias chips/picker
// + shared parts (Avatar, Button, IconButton, KeyHint, StatusChip) + icons.
//
// Why one file: in the original prototype these all globbed onto window and shared
// the same inline-style + CSS-var conventions. Splitting them adds import
// boilerplate without any cross-feature reuse.

import {
  CSSProperties,
  Fragment,
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import type { Density, Folder, Layout, ReceivedUI, SentUI } from './types';
import {
  ALIASES,
  Alias,
  AliasColors,
  DOMAIN,
  aliasColors,
  formatFullTime,
  formatRelativeTime,
  getAlias,
  getAvatarColor,
  getInitials,
} from './utils';
import { getThemeStyles } from './theme';

// ─── Icons ───────────────────────────────────────────────────────────────────
type IconProps = { size?: number; style?: CSSProperties };

const Icon = ({ children, size = 20, style }: IconProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={style}
  >
    {children}
  </svg>
);
const IconInbox = (p: IconProps) => <Icon {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></Icon>;
const IconSend = (p: IconProps) => <Icon {...p}><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></Icon>;
const IconStar = (p: IconProps) => <Icon {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Icon>;
const IconStarFilled = ({ size = 20, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true" style={style}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconSearch = (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
const IconCompose = (p: IconProps) => <Icon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></Icon>;
const IconBack = (p: IconProps) => <Icon {...p}><path d="m15 18-6-6 6-6"/></Icon>;
const IconArchive = (p: IconProps) => <Icon {...p}><rect x="2" y="4" width="20" height="5" rx="1"/><path d="M4 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></Icon>;
const IconTrash = (p: IconProps) => <Icon {...p}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Icon>;
const IconReply = (p: IconProps) => <Icon {...p}><path d="M9 17 4 12l5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></Icon>;
const IconForward = (p: IconProps) => <Icon {...p}><path d="m15 17 5-5-5-5"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></Icon>;
const IconMenu = (p: IconProps) => <Icon {...p}><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></Icon>;
const IconClose = (p: IconProps) => <Icon {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Icon>;
const IconMore = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Icon>;
const IconDraft = (p: IconProps) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Icon>;
const IconKey = (p: IconProps) => <Icon {...p}><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3"/></Icon>;
const IconAttach = (p: IconProps) => <Icon {...p}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></Icon>;
const IconCheck = (p: IconProps) => <Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>;

// ─── Shared parts ────────────────────────────────────────────────────────────
function Avatar({ name, size = 36, monochrome = false }: { name: string; size?: number; monochrome?: boolean }) {
  const c = monochrome
    ? { bg: 'var(--surface-2)', fg: 'var(--text-secondary)' }
    : getAvatarColor(name || '?');
  const initials = getInitials(name || '?');
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: c.bg,
        color: c.fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 600,
        letterSpacing: '0.02em',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
}

const STATUS_MAP = {
  delivered: { label: 'Delivered', bg: 'rgba(16,185,129,0.12)', fg: 'oklch(55% 0.13 150)', dot: 'oklch(60% 0.15 150)' },
  opened: { label: 'Opened', bg: 'var(--accent-soft)', fg: 'var(--accent)', dot: 'var(--accent)' },
  queued: { label: 'Queued', bg: 'rgba(150,150,160,0.14)', fg: 'var(--text-secondary)', dot: 'var(--text-tertiary)' },
  bounced: { label: 'Bounced', bg: 'rgba(225,29,72,0.10)', fg: 'oklch(58% 0.16 20)', dot: 'oklch(58% 0.16 20)' },
  complained: { label: 'Complained', bg: 'rgba(249,115,22,0.10)', fg: 'oklch(60% 0.15 50)', dot: 'oklch(60% 0.15 50)' },
} as const;

function StatusChip({ status }: { status: SentUI['last_event'] }) {
  const s = (status && STATUS_MAP[status]) || STATUS_MAP.queued;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 8px',
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function KeyHint({ keys }: { keys: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      {keys.split('').map((k, i) => (
        <kbd
          key={i}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            background: 'var(--surface-2)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            fontWeight: 500,
          }}
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger' | 'fab';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
  style?: CSSProperties;
  type?: 'button' | 'submit';
  disabled?: boolean;
  leadingIcon?: ReactNode;
  'aria-label'?: string;
};

function Button({
  variant = 'primary',
  size = 'md',
  onClick,
  children,
  style,
  type = 'button',
  disabled,
  leadingIcon,
  ...rest
}: ButtonProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: variant === 'fab' ? 28 : 999,
    fontWeight: 500,
    letterSpacing: '0.01em',
    transition: 'background 120ms ease, transform 80ms ease, box-shadow 120ms ease',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
  };
  const sizes: Record<NonNullable<ButtonProps['size']>, CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: 13, height: 30 },
    md: { padding: '8px 16px', fontSize: 14, height: 36 },
    lg: { padding: '10px 22px', fontSize: 15, height: 44 },
  };
  const variants: Record<NonNullable<ButtonProps['variant']>, CSSProperties> = {
    primary: { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: 'var(--shadow-1)' },
    secondary: { background: 'var(--surface-2)', color: 'var(--text)' },
    ghost: { background: 'transparent', color: 'var(--text)' },
    soft: { background: 'var(--accent-soft)', color: 'var(--accent)' },
    danger: { background: 'transparent', color: 'oklch(58% 0.16 20)' },
    fab: { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: 'var(--shadow-2)', padding: '0 24px', height: 56, fontSize: 15 },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = '')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
      {...rest}
    >
      {leadingIcon}
      {children}
    </button>
  );
}

function IconButton({
  children,
  onClick,
  label,
  active,
  size = 36,
  style,
}: {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  label: string;
  active?: boolean;
  size?: number;
  style?: CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size,
        height: size,
        border: 'none',
        borderRadius: '50%',
        background: active ? 'var(--accent-soft)' : hover ? 'var(--bg-hover)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 120ms ease, color 120ms ease',
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Alias chip + picker ─────────────────────────────────────────────────────
function AliasChip({
  address,
  size = 'sm',
  showDomain = false,
  style,
}: {
  address: string | null | undefined;
  size?: 'sm' | 'md';
  showDomain?: boolean;
  style?: CSSProperties;
}) {
  if (!address) return null;
  const alias = getAlias(address);
  const c = aliasColors(address);
  const isDark = typeof document !== 'undefined' && document.body.dataset.theme === 'dark';
  const local = String(address).split('@')[0];
  const sizes = {
    sm: { fs: 11, pad: '2px 8px', dot: 6, gap: 6 },
    md: { fs: 12.5, pad: '4px 10px', dot: 7, gap: 7 },
  } as const;
  const s = sizes[size];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.pad,
        borderRadius: 999,
        background: isDark ? c.bgDark : c.bg,
        color: isDark ? c.fgDark : c.fg,
        fontSize: s.fs,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ...style,
      }}
    >
      <span style={{ display: 'inline-block', width: s.dot, height: s.dot, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      <span>
        {alias ? alias.label.toLowerCase() : local}
        {showDomain && <span style={{ opacity: 0.6 }}>@{DOMAIN}</span>}
      </span>
    </span>
  );
}

function AliasPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const [editingCustom, setEditingCustom] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: globalThis.MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (editingCustom && inputRef.current) inputRef.current.focus();
  }, [editingCustom]);

  const c = aliasColors(value);
  const isDark = typeof document !== 'undefined' && document.body.dataset.theme === 'dark';

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px 6px 8px',
          borderRadius: 999,
          background: isDark ? c.bgDark : c.bg,
          color: isDark ? c.fgDark : c.fg,
          border: '1px solid transparent',
          fontSize: 13.5,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'border-color 120ms, transform 80ms',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
        <span>{value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ opacity: 0.7, marginLeft: 2 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 80,
            minWidth: 280,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-3)',
            padding: 6,
            animation: 'fadeIn 120ms ease',
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '8px 10px 6px',
            }}
          >
            Send from
          </div>
          {ALIASES.map((a, idx) => {
            const addr = `${a.local}@${DOMAIN}`;
            const ac = aliasColors(addr);
            const selected = value === addr;
            return (
              <button
                key={a.local}
                type="button"
                onClick={() => {
                  onChange(addr);
                  setOpen(false);
                  setEditingCustom(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '8px 10px',
                  background: selected ? 'var(--accent-soft)' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  if (!selected) e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!selected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: isDark ? ac.bgDark : ac.bg,
                    color: isDark ? ac.fgDark : ac.fg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ac.dot }} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{addr}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 1 }}>{a.hint}</div>
                </div>
                {selected && (
                  <span style={{ color: 'var(--accent)' }}>
                    <IconCheck size={16} />
                  </span>
                )}
                <kbd
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-tertiary)',
                    background: 'var(--surface-2)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                  }}
                >
                  ⌥{idx + 1}
                </kbd>
              </button>
            );
          })}

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 8px' }} />

          {editingCustom ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px' }}>
              <input
                ref={inputRef}
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/@.*$/, ''))}
                placeholder="custom"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && custom.trim()) {
                    onChange(`${custom.trim()}@${DOMAIN}`);
                    setOpen(false);
                    setEditingCustom(false);
                    setCustom('');
                  }
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '7px 10px',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 8,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12.5,
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  outline: 'none',
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-tertiary)' }}>@{DOMAIN}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingCustom(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '8px 10px',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'var(--text-secondary)',
                fontSize: 13,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'var(--surface-2)',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                ＋
              </span>
              <span>Custom alias…</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function SidebarNav({
  folder,
  setFolder,
  unreadCount,
  onCompose,
  collapsed,
  onClose,
  narrow,
}: {
  folder: Folder;
  setFolder: (f: Folder) => void;
  unreadCount: number;
  onCompose: () => void;
  collapsed: boolean;
  onClose: () => void;
  narrow: boolean;
}) {
  const items: { id: Folder; label: string; icon: ReactNode; count?: number }[] = [
    { id: 'inbox', label: 'Inbox', icon: <IconInbox />, count: unreadCount },
    { id: 'starred', label: 'Starred', icon: <IconStar /> },
    { id: 'sent', label: 'Sent', icon: <IconSend /> },
    { id: 'drafts', label: 'Drafts', icon: <IconDraft />, count: 1 },
  ];
  const isOverlay = narrow;
  return (
    <>
      {isOverlay && !collapsed && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}
      <aside
        style={{
          width: 232,
          background: 'var(--bg-elevated)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 12px 16px',
          flexShrink: 0,
          ...(isOverlay
            ? {
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: 0,
                zIndex: 41,
                transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
                transition: 'transform 220ms cubic-bezier(.2,.8,.2,1)',
                boxShadow: collapsed ? 'none' : 'var(--shadow-3)',
              }
            : {}),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 16px' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'var(--accent)',
              color: 'var(--accent-on)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '-0.02em',
            }}
          >
            h
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>hax429 mail</div>
        </div>

        <Button
          variant="primary"
          size="md"
          leadingIcon={<IconCompose size={16} />}
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            borderRadius: 12,
            height: 44,
            padding: '0 16px',
            marginBottom: 12,
          }}
          onClick={onCompose}
        >
          Compose
          <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
            <KeyHint keys="c" />
          </span>
        </Button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((it) => {
            const active = folder === it.id;
            return (
              <button
                key={it.id}
                onClick={() => {
                  setFolder(it.id);
                  if (isOverlay) onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0 12px',
                  height: 38,
                  border: 'none',
                  borderRadius: 999,
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text)',
                  fontWeight: active ? 600 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 120ms',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ display: 'inline-flex', color: active ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {it.icon}
                </span>
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.count ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: active ? 'var(--accent)' : 'var(--text-tertiary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {it.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: '12px 8px 0', borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '8px 4px 6px',
            }}
          >
            Shortcuts
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              columnGap: 10,
              rowGap: 6,
              fontSize: 12,
              color: 'var(--text-secondary)',
              padding: '0 4px',
            }}
          >
            <KeyHint keys="c" /> <span>Compose</span>
            <KeyHint keys="jk" /> <span>Next / prev</span>
            <KeyHint keys="s" /> <span>Star</span>
            <KeyHint keys="r" /> <span>Reply</span>
            <KeyHint keys="/" /> <span>Search</span>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Email list ──────────────────────────────────────────────────────────────
type AnyEmail = ReceivedUI | SentUI;

function isSentEmail(e: AnyEmail, isSent: boolean): e is SentUI {
  return isSent;
}

function emailDisplayName(e: AnyEmail, isSent: boolean): string {
  if (isSentEmail(e, isSent)) {
    const to = Array.isArray(e.to) ? e.to[0] : e.to;
    return to || '';
  }
  return (e as ReceivedUI).from_name || (e as ReceivedUI).from_addr;
}

function emailTime(e: AnyEmail, isSent: boolean): string {
  return formatRelativeTime(isSent ? (e as SentUI).created_at : (e as ReceivedUI).received_at);
}

function EmailRow({
  email,
  active,
  isSent,
  onClick,
  onToggleStar,
  density,
}: {
  email: AnyEmail;
  active: boolean;
  isSent: boolean;
  onClick: () => void;
  onToggleStar: (id: string) => void;
  density: Density;
}) {
  const [hover, setHover] = useState(false);
  const isUnread = !isSent && (email as ReceivedUI).unread;
  const name = emailDisplayName(email, isSent);
  const subject = email.subject || '(no subject)';
  const time = emailTime(email, isSent);
  const compact = density === 'compact';
  const spacious = density === 'spacious';
  const showSnippet = !compact;
  const starred = !isSent && (email as ReceivedUI).starred;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        gap: 12,
        padding: `${spacious ? 16 : compact ? 8 : 12}px 16px`,
        cursor: 'pointer',
        background: active ? 'var(--accent-soft)' : hover ? 'var(--bg-hover)' : 'transparent',
        borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
        position: 'relative',
        transition: 'background 100ms',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {isUnread && (
        <span
          style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--accent)',
          }}
        />
      )}

      <Avatar name={name} size={compact ? 28 : spacious ? 40 : 36} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            style={{
              fontWeight: isUnread ? 600 : 500,
              fontSize: 14,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
              minWidth: 0,
            }}
          >
            {isSent ? 'To: ' : ''}
            {name}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {time}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            style={{
              fontWeight: isUnread ? 500 : 400,
              fontSize: 13.5,
              color: isUnread ? 'var(--text)' : 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: '1 1 auto',
              minWidth: 0,
            }}
          >
            {subject}
          </span>
          {!isSent && (email as ReceivedUI).to_addrs && (
            <AliasChip address={(email as ReceivedUI).to_addrs} size="sm" />
          )}
          {isSent && (email as SentUI).last_event && (
            <StatusChip status={(email as SentUI).last_event} />
          )}
        </div>
        {showSnippet && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--text-tertiary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.4,
            }}
          >
            {email.snippet}
          </div>
        )}
      </div>

      {!isSent && (
        <IconButton
          size={28}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(email.id);
          }}
          label={starred ? 'Unstar' : 'Star'}
          style={{
            alignSelf: 'flex-start',
            marginTop: 2,
            color: starred ? 'oklch(72% 0.16 80)' : 'var(--text-tertiary)',
            opacity: hover || starred ? 1 : 0,
          }}
        >
          {starred ? <IconStarFilled size={16} /> : <IconStar size={16} />}
        </IconButton>
      )}
    </div>
  );
}

function EmptyInbox({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        minHeight: 320,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <IconInbox size={26} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13.5, maxWidth: 380, lineHeight: 1.55 }}>{subtitle}</div>}
    </div>
  );
}

// ─── Reader ──────────────────────────────────────────────────────────────────
function Reader({
  email,
  isSent,
  onClose,
  onToggleStar,
  onReply,
  mode = 'pane',
}: {
  email: AnyEmail | null | undefined;
  isSent: boolean;
  onClose?: (() => void) | null;
  onToggleStar?: (id: string) => void;
  onReply: () => void;
  mode?: 'pane' | 'fullscreen';
}) {
  if (!email) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'var(--text-tertiary)',
          background: 'var(--bg)',
          padding: 32,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            color: 'var(--text-tertiary)',
          }}
        >
          <IconInbox size={28} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Select a message to read</div>
        <div style={{ fontSize: 12.5, marginTop: 6, color: 'var(--text-tertiary)' }}>
          <KeyHint keys="jk" /> <span style={{ marginLeft: 8 }}>to navigate</span>
        </div>
      </div>
    );
  }

  const name = emailDisplayName(email, isSent);
  const subj = email.subject || '(no subject)';
  const time = formatFullTime(isSent ? (email as SentUI).created_at : (email as ReceivedUI).received_at);
  const fromAddr = isSent ? (email as SentUI).from : (email as ReceivedUI).from_addr;
  const fromEmail = isSent ? (email as SentUI).from : (email as ReceivedUI).from_email || fromAddr;
  const toAddress = isSent
    ? Array.isArray((email as SentUI).to)
      ? ((email as SentUI).to as string[])[0]
      : ((email as SentUI).to as string)
    : (email as ReceivedUI).to_addrs;
  const baseHtml = isSent ? (email as SentUI).html : (email as ReceivedUI).html;
  const baseText = isSent ? (email as SentUI).text : (email as ReceivedUI).text;
  const [fetchedBody, setFetchedBody] = useState<{ html: string | null; text: string | null } | null>(null);
  useEffect(() => {
    setFetchedBody(null);
    if (!isSent || !email?.id || baseHtml || baseText) return;
    let cancelled = false;
    fetch(`/api/emails/sent/${email.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!cancelled && body) setFetchedBody(body);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [email?.id, isSent, baseHtml, baseText]);
  const html = baseHtml ?? fetchedBody?.html ?? null;
  const text = baseText ?? fetchedBody?.text ?? null;
  const starred = !isSent && (email as ReceivedUI).starred;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          flexShrink: 0,
        }}
      >
        {mode === 'fullscreen' && onClose && (
          <IconButton onClick={onClose} label="Back" size={36}>
            <IconBack size={20} />
          </IconButton>
        )}
        <IconButton onClick={onReply} label="Reply (r)" size={36}>
          <IconReply size={18} />
        </IconButton>
        <IconButton label="Forward (f)" size={36}>
          <IconForward size={18} />
        </IconButton>
        <IconButton label="Archive (e)" size={36}>
          <IconArchive size={18} />
        </IconButton>
        <IconButton label="Delete (#)" size={36}>
          <IconTrash size={18} />
        </IconButton>
        {!isSent && (
          <IconButton
            onClick={() => onToggleStar && onToggleStar(email.id)}
            label={starred ? 'Unstar (s)' : 'Star (s)'}
            size={36}
            style={{ color: starred ? 'oklch(72% 0.16 80)' : 'var(--text-secondary)' }}
          >
            {starred ? <IconStarFilled size={18} /> : <IconStar size={18} />}
          </IconButton>
        )}
        <div style={{ flex: 1 }} />
        <IconButton label="More" size={36}>
          <IconMore size={18} />
        </IconButton>
        {mode === 'pane' && onClose && (
          <IconButton onClick={onClose} label="Close" size={36}>
            <IconClose size={18} />
          </IconButton>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ padding: '28px 32px 24px', maxWidth: 820, margin: '0 auto' }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
              lineHeight: 1.25,
              color: 'var(--text)',
            }}
          >
            {subj}
          </h1>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24 }}>
            <Avatar name={name} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text)' }}>{name}</span>
                <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  &lt;{fromEmail}&gt;
                </span>
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span>to</span>
                <AliasChip address={toAddress} size="md" showDomain />
                <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{time}</span>
                {isSent && (email as SentUI).last_event && (
                  <>
                    <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                    <StatusChip status={(email as SentUI).last_event} />
                  </>
                )}
              </div>
            </div>
          </div>

          {html ? (
            <iframe
              srcDoc={html}
              sandbox=""
              style={{
                width: '100%',
                minHeight: 400,
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'var(--bg-elevated)',
              }}
            />
          ) : (
            <div
              style={{
                fontSize: 14.5,
                lineHeight: 1.7,
                color: 'var(--text)',
                whiteSpace: 'pre-wrap',
                paddingBottom: 32,
              }}
            >
              {text || email.snippet || '(empty body)'}
            </div>
          )}

          <div
            style={{
              marginTop: 8,
              padding: 14,
              border: '1px solid var(--border)',
              borderRadius: 14,
              background: 'var(--surface)',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Avatar name="me@hax429.me" size={32} monochrome />
            <button
              onClick={onReply}
              style={{
                flex: '1 1 200px',
                minWidth: 0,
                textAlign: 'left',
                padding: '10px 14px',
                background: 'var(--surface-2)',
                border: 'none',
                borderRadius: 999,
                color: 'var(--text-tertiary)',
                fontSize: 13.5,
                cursor: 'text',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Reply to {name.split(/[\s<]/)[0]}…
            </button>
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              <Button variant="ghost" size="sm" onClick={onReply} leadingIcon={<IconReply size={14} />}>
                Reply
              </Button>
              <Button variant="ghost" size="sm" leadingIcon={<IconForward size={14} />}>
                Forward
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Compose ─────────────────────────────────────────────────────────────────
type ReplyTo = {
  from: string;
  to: string;
  subject: string;
  body: string;
};

function ComposeField({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', width: 56, flexShrink: 0 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 14,
          color: 'var(--text)',
        }}
      />
    </div>
  );
}

function Compose({
  open,
  onClose,
  replyTo,
  mode = 'modal',
}: {
  open: boolean;
  onClose: () => void;
  replyTo: ReplyTo | null;
  mode?: 'modal' | 'floating';
}) {
  const [from, setFrom] = useState('gabriel@hax429.me');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setFrom(replyTo?.from || 'gabriel@hax429.me');
      setTo(replyTo?.to || '');
      setSubject(replyTo?.subject || '');
      setBody(replyTo?.body || '');
      setMinimized(false);
    }
  }, [open, replyTo]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.metaKey || e.ctrlKey) return;
      const n = parseInt(e.key, 10);
      if (!n || n < 1 || n > ALIASES.length) return;
      e.preventDefault();
      const a = ALIASES[n - 1];
      setFrom(`${a.local}@${DOMAIN}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const isFloating = mode === 'floating';

  async function handleSend() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set('from', from);
      form.set('to', to);
      form.set('subject', subject);
      form.set('text', body);
      const res = await fetch('/api/send', { method: 'POST', body: form, redirect: 'manual' });
      // /api/send redirects on success; treat any non-error as success.
      if (res.status >= 400 && res.status < 500) {
        const j = await res.json().catch(() => ({}));
        alert(`Send failed: ${j.error || res.statusText}`);
        return;
      }
      onClose();
      router.push('/sent');
    } finally {
      setSubmitting(false);
    }
  }

  const shell: CSSProperties = isFloating
    ? {
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 60,
        width: minimized ? 320 : 'min(560px, calc(100vw - 40px))',
        maxHeight: minimized ? 48 : 'min(640px, calc(100vh - 40px))',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-3)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease, max-height 200ms ease',
      }
    : {
        width: 'min(680px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 64px)',
        background: 'var(--bg-elevated)',
        borderRadius: 18,
        boxShadow: 'var(--shadow-3)',
        display: 'flex',
        flexDirection: 'column',
      };

  const inner = (
    <div style={shell}>
      <div
        style={{
          padding: '12px 12px 12px 18px',
          background: isFloating ? 'var(--surface-2)' : 'transparent',
          borderTopLeftRadius: isFloating ? 16 : 18,
          borderTopRightRadius: isFloating ? 16 : 18,
          borderBottom: isFloating ? 'none' : '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          {replyTo ? 'Reply' : 'New message'}
        </div>
        {isFloating && (
          <IconButton size={28} label={minimized ? 'Expand' : 'Minimize'} onClick={() => setMinimized(!minimized)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              {minimized ? <polyline points="6 15 12 9 18 15" /> : <polyline points="6 9 12 15 18 9" />}
            </svg>
          </IconButton>
        )}
        <IconButton size={28} onClick={onClose} label="Close">
          <IconClose size={16} />
        </IconButton>
      </div>

      {!minimized && (
        <>
          <div style={{ padding: '8px 18px 0', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', width: 56, flexShrink: 0 }}>From</span>
              <AliasPicker value={from} onChange={setFrom} />
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <KeyHint keys="⌥1" /> <span>switch</span>
              </span>
            </div>
            <ComposeField label="To" value={to} onChange={setTo} placeholder="someone@example.com" autoFocus />
            <ComposeField label="Subject" value={subject} onChange={setSubject} />
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message…"
            style={{
              flex: 1,
              minHeight: isFloating ? 220 : 320,
              padding: '14px 18px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              color: 'var(--text)',
              fontSize: 14.5,
              lineHeight: 1.6,
              fontFamily: 'inherit',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
            }}
          >
            <Button variant="primary" size="md" onClick={handleSend} disabled={submitting || !to || !subject}>
              {submitting ? 'Sending…' : 'Send'}
            </Button>
            <IconButton label="Attach" size={36}>
              <IconAttach size={18} />
            </IconButton>
            <div style={{ flex: 1 }} />
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <KeyHint keys="⌘↵" /> <span>send</span>
            </div>
            <IconButton onClick={onClose} label="Discard" size={36}>
              <IconTrash size={18} />
            </IconButton>
          </div>
        </>
      )}
    </div>
  );

  if (isFloating) return inner;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 160ms ease',
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>{inner}</div>
    </div>
  );
}

// ─── Top bar + headers + shortcuts overlay ───────────────────────────────────
function TopBar({
  search,
  setSearch,
  onMenu,
  showMenu,
  onShortcuts,
}: {
  search: string;
  setSearch: (v: string) => void;
  onMenu: () => void;
  showMenu: boolean;
  onShortcuts: () => void;
}) {
  return (
    <header
      style={{
        height: 60,
        padding: '0 16px',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}
    >
      {showMenu && (
        <IconButton onClick={onMenu} label="Menu" size={40}>
          <IconMenu size={20} />
        </IconButton>
      )}

      <div
        style={{
          flex: 1,
          maxWidth: 720,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 14px',
          height: 40,
          background: 'var(--surface-2)',
          borderRadius: 12,
          transition: 'background 120ms',
        }}
      >
        <IconSearch size={16} />
        <input
          id="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mail"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 14,
            color: 'var(--text)',
          }}
        />
        {!search && (
          <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
            <KeyHint keys="/" />
          </span>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <IconButton onClick={onShortcuts} label="Keyboard shortcuts (?)" size={36}>
        <IconKey size={18} />
      </IconButton>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        h4
      </div>
    </header>
  );
}

function ListHeader({ folder, count, unread }: { folder: Folder; count: number; unread: number }) {
  const labels: Record<Folder, string> = {
    inbox: 'Inbox',
    starred: 'Starred',
    sent: 'Sent',
    drafts: 'Drafts',
  };
  return (
    <div
      style={{
        padding: '14px 18px 12px',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{labels[folder]}</h2>
        {folder === 'inbox' && unread > 0 && (
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {unread} new
          </span>
        )}
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
        {count} {count === 1 ? 'message' : 'messages'}
      </span>
    </div>
  );
}

function ListFooter({ folder }: { folder: Folder }) {
  return (
    <div
      style={{
        padding: '8px 18px',
        fontSize: 11.5,
        color: 'var(--text-tertiary)',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {folder === 'sent' ? 'Live · resend.emails.list()' : 'SQLite · WAL'}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <KeyHint keys="?" /> shortcuts
      </span>
    </div>
  );
}

function ShortcutsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const rows: [string, string][] = [
    ['c', 'Compose'],
    ['/', 'Focus search'],
    ['j / k', 'Next / previous message'],
    ['s', 'Star / unstar'],
    ['r', 'Reply'],
    ['e', 'Archive'],
    ['#', 'Delete'],
    ['esc', 'Close reader / compose'],
    ['?', 'Toggle this overlay'],
  ];
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 140ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, 100%)',
          background: 'var(--bg-elevated)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-3)',
          border: '1px solid var(--border)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Keyboard shortcuts</h3>
          <IconButton onClick={onClose} size={32} label="Close">
            <IconClose size={16} />
          </IconButton>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 16, rowGap: 10 }}>
          {rows.map(([k, l]) => (
            <Fragment key={k}>
              <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <KeyHint keys={k.replace(/ \/ /g, '/').replace(/ /g, '')} />
              </span>
              <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{l}</span>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Theme application hook ──────────────────────────────────────────────────
type ThemeMode = 'auto' | 'light' | 'dark';

const DEFAULT_TWEAKS = {
  theme: 'auto' as ThemeMode,
  accent: '#1976d2',
  density: 'comfortable' as Density,
  layout: 'split' as Layout,
  fontFamily: 'Inter',
};

function useTheme() {
  useEffect(() => {
    const apply = () => {
      const dark =
        DEFAULT_TWEAKS.theme === 'dark' ||
        (DEFAULT_TWEAKS.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      let el = document.getElementById('mail-theme-vars') as HTMLStyleElement | null;
      if (!el) {
        el = document.createElement('style');
        el.id = 'mail-theme-vars';
        document.head.appendChild(el);
      }
      el.textContent = getThemeStyles({
        accent: DEFAULT_TWEAKS.accent,
        fontFamily: DEFAULT_TWEAKS.fontFamily,
        density: DEFAULT_TWEAKS.density,
        dark,
      });
      document.body.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
}

// ─── Main shell ──────────────────────────────────────────────────────────────
export type MailShellProps = {
  initialFolder?: Folder;
  initialComposeOpen?: boolean;
  initialSelectedId?: string | null;
  received: ReceivedUI[];
  sent: SentUI[];
};

export default function MailShell({
  initialFolder = 'inbox',
  initialComposeOpen = false,
  initialSelectedId = null,
  received: initialReceived,
  sent,
}: MailShellProps) {
  useTheme();
  const router = useRouter();

  const tweaks = DEFAULT_TWEAKS;

  const [folder, setFolderRaw] = useState<Folder>(initialFolder);
  const [received, setReceived] = useState<ReceivedUI[]>(initialReceived);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [search, setSearch] = useState('');
  const [composeOpen, setComposeOpen] = useState(initialComposeOpen);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = vw < 760;
  const isTablet = vw < 1080;
  const isSplit = tweaks.layout === 'split' && !isMobile;

  const isSent = folder === 'sent';

  const setFolder = useCallback(
    (f: Folder) => {
      setFolderRaw(f);
      setSelectedId(null);
      if (f === 'inbox' || f === 'starred') router.replace('/inbox');
      else if (f === 'sent') router.replace('/sent');
    },
    [router],
  );

  const baseList: AnyEmail[] = useMemo(() => {
    if (isSent) return sent;
    if (folder === 'starred') return received.filter((r) => r.starred);
    if (folder === 'drafts') return [];
    return received;
  }, [folder, isSent, received, sent]);

  const filtered: AnyEmail[] = useMemo(() => {
    if (!search.trim()) return baseList;
    const q = search.toLowerCase();
    return baseList.filter((e) => {
      const parts: string[] = [e.subject ?? '', e.snippet ?? ''];
      if (isSentEmail(e, isSent)) {
        const to = Array.isArray(e.to) ? e.to.join(' ') : e.to;
        parts.push(to, e.from);
      } else {
        parts.push((e as ReceivedUI).from_addr, (e as ReceivedUI).from_name ?? '');
      }
      return parts.filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [baseList, isSent, search]);

  const selected =
    filtered.find((e) => e.id === selectedId) || baseList.find((e) => e.id === selectedId) || null;

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!filtered.some((e) => e.id === selectedId)) {
      setSelectedId(isSplit ? filtered[0].id : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder, search]);

  const unreadCount = received.filter((r) => r.unread).length;

  const toggleStar = useCallback((id: string) => {
    setReceived((prev) => prev.map((r) => (r.id === id ? { ...r, starred: !r.starred } : r)));
  }, []);

  const openMessage = useCallback((id: string) => {
    setReceived((prev) => prev.map((r) => (r.id === id ? { ...r, unread: false } : r)));
    setSelectedId(id);
  }, []);

  const closeReader = useCallback(() => setSelectedId(null), []);

  const onCompose = useCallback(() => {
    setReplyTo(null);
    setComposeOpen(true);
  }, []);

  const onReply = useCallback(() => {
    if (!selected) return;
    const name = isSentEmail(selected, isSent)
      ? Array.isArray(selected.to)
        ? selected.to[0]
        : selected.to
      : (selected as ReceivedUI).from_email || (selected as ReceivedUI).from_addr || '';
    const replyFrom = isSentEmail(selected, isSent)
      ? selected.from || 'gabriel@hax429.me'
      : (selected as ReceivedUI).to_addrs || 'gabriel@hax429.me';
    const ts = isSentEmail(selected, isSent) ? selected.created_at : (selected as ReceivedUI).received_at;
    const fromName = isSentEmail(selected, isSent)
      ? selected.from
      : (selected as ReceivedUI).from_name || (selected as ReceivedUI).from_addr;
    setReplyTo({
      from: replyFrom,
      to: name,
      subject: (selected.subject || '').startsWith('Re:') ? selected.subject || '' : `Re: ${selected.subject || ''}`,
      body: `\n\n— On ${formatFullTime(ts)}, ${fromName} wrote:\n> ${(selected.snippet || '').slice(0, 140)}…`,
    });
    setComposeOpen(true);
  }, [selected, isSent]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) {
        if (e.key === 'Escape' && tag === 'input') (target as HTMLInputElement).blur();
        return;
      }
      if (e.key === 'c') {
        e.preventDefault();
        onCompose();
      } else if (e.key === '/') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      } else if (e.key === 's' && selected) {
        e.preventDefault();
        if (!isSent) toggleStar(selected.id);
      } else if (e.key === 'r' && selected) {
        e.preventDefault();
        onReply();
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((s) => !s);
      } else if (e.key === 'Escape') {
        if (composeOpen) setComposeOpen(false);
        else if (selectedId && !isSplit) closeReader();
      } else if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        const i = filtered.findIndex((x) => x.id === selectedId);
        const next = e.key === 'j' ? Math.min(filtered.length - 1, i + 1) : Math.max(0, i - 1);
        const nx = filtered[next];
        if (nx) openMessage(nx.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, selectedId, selected, isSent, isSplit, composeOpen, openMessage, toggleStar, onCompose, onReply, closeReader]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      <SidebarNav
        folder={folder}
        setFolder={setFolder}
        unreadCount={unreadCount}
        onCompose={onCompose}
        collapsed={!sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        narrow={isMobile || tweaks.layout === 'single'}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          search={search}
          setSearch={setSearch}
          onMenu={() => setSidebarOpen(true)}
          showMenu={isMobile || tweaks.layout === 'single'}
          onShortcuts={() => setShowShortcuts((s) => !s)}
        />

        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {(!isMobile || !selectedId) && (
            <div
              style={{
                width: isSplit ? (isTablet ? 360 : 420) : '100%',
                borderRight: isSplit ? '1px solid var(--border)' : 'none',
                background: 'var(--bg-elevated)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                minHeight: 0,
                maxWidth: isMobile ? '100%' : isSplit ? 460 : 'none',
              }}
            >
              <ListHeader folder={folder} count={filtered.length} unread={unreadCount} />
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {filtered.length === 0 ? (
                  <EmptyInbox
                    title={
                      search
                        ? 'No results'
                        : folder === 'starred'
                        ? 'No starred messages'
                        : folder === 'drafts'
                        ? 'No drafts'
                        : folder === 'sent'
                        ? 'Nothing sent yet'
                        : 'Inbox is clear'
                    }
                    subtitle={
                      search
                        ? `Nothing matching “${search}”.`
                        : folder === 'inbox'
                        ? 'Once your MX records point to Resend and the webhook is configured to POST to /api/webhook, messages appear here.'
                        : folder === 'sent'
                        ? 'Send your first message — it will land here after Resend acks it.'
                        : null
                    }
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {filtered.map((e) => (
                      <EmailRow
                        key={e.id}
                        email={e}
                        active={isSplit ? e.id === selectedId : false}
                        isSent={isSent}
                        onClick={() => openMessage(e.id)}
                        onToggleStar={toggleStar}
                        density={tweaks.density}
                      />
                    ))}
                  </div>
                )}
              </div>
              <ListFooter folder={folder} />
            </div>
          )}

          {isSplit ? (
            <Reader
              email={selected}
              isSent={isSent}
              onToggleStar={toggleStar}
              onReply={onReply}
              onClose={null}
              mode="pane"
            />
          ) : (
            selected && (
              <div
                style={{
                  position: isMobile ? 'fixed' : 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: isMobile ? 0 : 'auto',
                  width: isMobile ? '100%' : 'min(720px, 100%)',
                  background: 'var(--bg)',
                  zIndex: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isMobile ? 'none' : 'var(--shadow-3)',
                  animation: isMobile ? 'slideInRight 220ms cubic-bezier(.2,.8,.2,1)' : 'fadeIn 160ms ease',
                }}
              >
                <Reader
                  email={selected}
                  isSent={isSent}
                  onToggleStar={toggleStar}
                  onReply={onReply}
                  onClose={closeReader}
                  mode="fullscreen"
                />
              </div>
            )
          )}
        </div>
      </div>

      <Compose
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        replyTo={replyTo}
        mode={isSplit && !isMobile ? 'floating' : 'modal'}
      />

      <ShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {(isMobile || tweaks.layout === 'single') && !composeOpen && !selectedId && (
        <button
          onClick={onCompose}
          aria-label="Compose"
          style={{
            position: 'fixed',
            right: 20,
            bottom: 24,
            zIndex: 50,
            width: 56,
            height: 56,
            borderRadius: 18,
            background: 'var(--accent)',
            color: 'var(--accent-on)',
            border: 'none',
            boxShadow: 'var(--shadow-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <IconCompose size={22} />
        </button>
      )}
    </div>
  );
}
