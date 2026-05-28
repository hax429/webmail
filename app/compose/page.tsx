import { DEFAULT_FROM } from '@/lib/resend';

export default function ComposePage() {
  return (
    <div>
      <h1>Compose</h1>
      <form action="/api/send" method="post" style={formStyle}>
        <label style={labelStyle}>
          <span>From</span>
          <input name="from" defaultValue={DEFAULT_FROM} style={inputStyle} />
        </label>
        <label style={labelStyle}>
          <span>To (comma-separated)</span>
          <input name="to" required placeholder="someone@example.com" style={inputStyle} />
        </label>
        <label style={labelStyle}>
          <span>Subject</span>
          <input name="subject" required style={inputStyle} />
        </label>
        <label style={labelStyle}>
          <span>Body</span>
          <textarea name="text" rows={12} style={{ ...inputStyle, fontFamily: 'inherit' }} />
        </label>
        <button type="submit" style={buttonStyle}>Send</button>
      </form>
    </div>
  );
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  maxWidth: 700,
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 14,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 16px',
  background: '#0366d6',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  alignSelf: 'flex-start',
};
