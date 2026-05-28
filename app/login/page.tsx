import { getThemeStyles } from '@/components/mail/theme';

export const dynamic = 'force-dynamic';

const PAGE_CSS = `
  body {
    background:
      radial-gradient(1000px 600px at 80% -10%, var(--accent-soft), transparent 60%),
      radial-gradient(800px 500px at -10% 110%, var(--accent-soft-hover), transparent 60%),
      var(--bg);
  }
  .login-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .login-card {
    width: 100%;
    max-width: 380px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-3);
    padding: 32px 28px;
  }
  .login-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 22px;
  }
  .login-logo {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--accent);
    color: var(--accent-on);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 15px;
    letter-spacing: -0.02em;
  }
  .login-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.01em;
  }
  .login-subtitle {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 2px;
  }
  .login-heading {
    font-size: 20px;
    font-weight: 600;
    color: var(--text);
    margin: 8px 0 4px;
    letter-spacing: -0.02em;
  }
  .login-hint {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 22px;
  }
  .login-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .login-input {
    width: 100%;
    padding: 11px 13px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-size: 14.5px;
    transition: border-color 120ms, box-shadow 120ms;
  }
  .login-input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
  .login-button {
    width: 100%;
    margin-top: 16px;
    padding: 11px 16px;
    background: var(--accent);
    color: var(--accent-on);
    border: none;
    border-radius: var(--radius);
    font-size: 14.5px;
    font-weight: 600;
    cursor: pointer;
    transition: background 120ms, transform 60ms;
  }
  .login-button:hover { background: var(--accent-dark); }
  .login-button:active { transform: scale(0.99); }
  .login-error {
    margin-top: 14px;
    padding: 10px 12px;
    background: rgba(225,29,72,0.10);
    border: 1px solid rgba(225,29,72,0.35);
    color: oklch(58% 0.20 18);
    border-radius: var(--radius);
    font-size: 13px;
  }
  .login-footer {
    margin-top: 22px;
    text-align: center;
    font-size: 12px;
    color: var(--text-tertiary);
    font-family: var(--font-mono);
  }
`;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const themeCss = getThemeStyles({
    accent: '#1976d2',
    fontFamily: 'Inter',
    density: 'comfortable',
    dark: false,
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss + PAGE_CSS }} />
      <div className="login-wrap">
        <form className="login-card" method="post" action="/api/login">
          <div className="login-brand">
            <div className="login-logo">h</div>
            <div>
              <div className="login-title">hax429 mail</div>
              <div className="login-subtitle">mail.hax429.me</div>
            </div>
          </div>

          <h1 className="login-heading">Sign in</h1>
          <p className="login-hint">Enter the password to access your inbox.</p>

          <label className="login-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            className="login-input"
            placeholder="••••••••"
          />

          {next ? <input type="hidden" name="next" value={next} /> : null}

          <button type="submit" className="login-button">
            Continue
          </button>

          {error ? <div className="login-error">Incorrect password. Try again.</div> : null}

          <div className="login-footer">resend · sqlite · nextjs</div>
        </form>
      </div>
    </>
  );
}
