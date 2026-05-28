import type { ReactNode } from 'react';

export const metadata = { title: 'hax429 mail' };

const PRE_PAINT_CSS = `
  html, body { margin: 0; padding: 0; background: #f6f7f9; color: #11161e;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
  @media (prefers-color-scheme: dark) {
    html, body { background: #0e1116; color: #e6edf3; }
  }
  #app-root { min-height: 100vh; }
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Geist:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: PRE_PAINT_CSS }} />
      </head>
      <body>
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
