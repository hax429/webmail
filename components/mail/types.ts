export type Folder = 'inbox' | 'starred' | 'sent' | 'drafts';

export type Density = 'compact' | 'comfortable' | 'spacious';

export type Layout = 'split' | 'single';

export type ReceivedUI = {
  id: string;
  from_addr: string;
  from_name: string | null;
  from_email: string | null;
  to_addrs: string;
  subject: string | null;
  snippet: string | null;
  text: string | null;
  html: string | null;
  received_at: string;
  unread: boolean;
  starred: boolean;
};

export type SentUI = {
  id: string;
  from: string;
  to: string[] | string;
  subject: string | null;
  snippet: string | null;
  text: string | null;
  html: string | null;
  created_at: string;
  last_event: 'delivered' | 'opened' | 'queued' | 'bounced' | 'complained' | null;
};
