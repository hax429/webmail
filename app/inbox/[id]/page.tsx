import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReceived } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ReceivedDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = getReceived(id);
  if (!row) notFound();

  return (
    <div>
      <p><Link href="/inbox">← Inbox</Link></p>
      <h1 style={{ marginBottom: 4 }}>{row.subject || '(no subject)'}</h1>
      <div style={{ color: '#666', marginBottom: 16 }}>
        From <strong>{row.from_addr}</strong> to {row.to_addrs} ·{' '}
        {new Date(row.received_at).toLocaleString()}
      </div>
      {row.html ? (
        <iframe
          srcDoc={row.html}
          sandbox=""
          style={{ width: '100%', minHeight: 500, border: '1px solid #ddd', background: '#fff' }}
        />
      ) : (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: 16, border: '1px solid #ddd' }}>
          {row.text ?? '(empty body)'}
        </pre>
      )}
    </div>
  );
}
