import MailShell from '@/components/mail/MailShell';
import { loadReceived, loadSent } from '@/components/mail/server';

export const dynamic = 'force-dynamic';

export default async function SentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [received, sent] = await Promise.all([
    Promise.resolve(loadReceived(200)),
    loadSent(100),
  ]);
  return (
    <MailShell
      initialFolder="sent"
      initialSelectedId={id}
      received={received}
      sent={sent}
    />
  );
}
