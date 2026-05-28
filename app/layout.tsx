import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata = { title: 'hax429 mail' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={bodyStyle}>
        <header style={headerStyle}>
          <strong style={{ marginRight: 24 }}>hax429.me mail</strong>
          <Link href="/inbox" style={navLink}>Inbox</Link>
          <Link href="/sent" style={navLink}>Sent</Link>
          <Link href="/compose" style={navLink}>Compose</Link>
        </header>
        <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>{children}</main>
      </body>
    </html>
  );
}

const bodyStyle: React.CSSProperties = {
  margin: 0,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  background: '#fafafa',
  color: '#111',
};

const headerStyle: React.CSSProperties = {
  borderBottom: '1px solid #e5e5e5',
  padding: '12px 24px',
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const navLink: React.CSSProperties = {
  color: '#0366d6',
  textDecoration: 'none',
  marginRight: 12,
};
