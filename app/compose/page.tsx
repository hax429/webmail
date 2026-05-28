import MailShell from '@/components/mail/MailShell';
import { loadReceived, loadSent } from '@/components/mail/server';

export const dynamic = 'force-dynamic';

export default async function ComposePage() {
  const [received, sent] = await Promise.all([
    Promise.resolve(loadReceived(200)),
    loadSent(100),
  ]);
  return <MailShell initialFolder="inbox" initialComposeOpen received={received} sent={sent} />;
}
