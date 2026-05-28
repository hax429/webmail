import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resend } from '@/lib/resend';

export const dynamic = 'force-dynamic';

export default async function SentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, error } = await resend.emails.get(id);
  if (error || !data) notFound();

  const to = Array.isArray(data.to) ? data.to.join(', ') : data.to;

  return (
    <div>
      <p><Link href="/sent">← Sent</Link></p>
      <h1 style={{ marginBottom: 4 }}>{data.subject || '(no subject)'}</h1>
      <div style={{ color: '#666', marginBottom: 16 }}>
        From <strong>{data.from}</strong> to {to} ·{' '}
        {data.created_at ? new Date(data.created_at).toLocaleString() : ''}
        {data.last_event ? <> · status <code>{data.last_event}</code></> : null}
      </div>
      {data.html ? (
        <iframe
          srcDoc={data.html}
          sandbox=""
          style={{ width: '100%', minHeight: 500, border: '1px solid #ddd', background: '#fff' }}
        />
      ) : (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: 16, border: '1px solid #ddd' }}>
          {data.text ?? '(empty body)'}
        </pre>
      )}
    </div>
  );
}
