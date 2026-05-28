# hax429-mail

Tiny Next.js app at `mail.hax429.me` that:

- Sends email via the Resend API (and, optionally, Resend's SMTP relay)
- Receives inbound mail through a Resend webhook → SQLite
- Shows **Inbox**, **Sent**, **Compose** in a basic web UI

Runs directly on this host (no Docker), behind the existing nginx + Let's Encrypt cert, mirroring the pattern used by `services/web/hax429.me`.

```
Listens on:  localhost:3020
Fronted by:  /etc/nginx/sites-available/mail.hax429.me  → proxies to :3020
Managed by:  systemd unit `hax429-mail.service`
Storage:     SQLite file at services/mail/data/mail.db
```

---

## Cutover plan (Stalwart → Resend)

Do these in order. The dangerous step is repointing MX — until then Stalwart still receives.

1. **Resend account + domain** — verify `hax429.me` and copy the SPF/DKIM records (§1, §2).
2. **App** — install deps, set `.env`, install systemd unit, start it (§3).
3. **Nginx** — swap `mail.hax429.me` from Stalwart's port 8080 to this app's port 3020 (§4). At this point the web UI works for **sending only** — inbox is still empty.
4. **Webhook** — create the Resend webhook pointing at `https://mail.hax429.me/api/webhook`, copy the signing secret into `.env`, restart service (§5).
5. **Stop Stalwart**, then **repoint MX** to Resend's inbound server (§6). Inbox starts filling.
6. **Optional**: SMTP credentials for Apple Mail / Thunderbird (§7).

---

## 1. DNS records on `hax429.me`

You configure these at whoever hosts your DNS (Cloudflare, your registrar, etc.). Resend's dashboard will show you the *exact* values for your domain — these are the shapes to expect.

### Outbound (sending) — required first

| Type | Host | Value | TTL | Notes |
|---|---|---|---|---|
| TXT | `send.hax429.me` | `v=spf1 include:amazonses.com ~all` | 300 | SPF for the sending subdomain Resend uses |
| MX  | `send.hax429.me` | `feedback-smtp.us-east-1.amazonses.com` (priority **10**) | 300 | Receives bounce/complaint reports |
| TXT | `resend._domainkey.hax429.me` | (long DKIM public key shown in Resend dashboard) | 300 | DKIM signing key |
| TXT | `_dmarc.hax429.me` *(recommended, you may already have one)* | `v=DMARC1; p=none; rua=mailto:postmaster@hax429.me` | 300 | DMARC policy. Keep `p=none` until you're confident, then move to `quarantine`/`reject`. |

After these propagate, click **Verify** in Resend's dashboard.

### Inbound (receiving) — only when you're ready to retire Stalwart

| Type | Host | Value | Priority | Notes |
|---|---|---|---|---|
| MX | `hax429.me` (`@`) | `inbound-smtp.resend.com` | **1** (lowest number = highest priority) | **Replaces any existing MX pointing at this server / Stalwart.** Resend shows the exact hostname for your account. |

⚠️ **Until this MX is changed, no mail reaches Resend** and the Inbox page stays empty. After the change, Stalwart stops receiving for `hax429.me`.

---

## 2. Resend dashboard setup

1. Sign up at <https://resend.com>.
2. **Domains → Add Domain** → `hax429.me` → add the records from §1 → **Verify**.
3. **API Keys → Create API Key** → name it `hax429-mail`, permission **Full access** (needs both `emails:send` and `emails:read`). Copy the `re_…` value — you'll only see it once.
4. (Step §5 below covers the inbound webhook — do that *after* the app is reachable on HTTPS.)

---

## 3. App + systemd

```bash
cd /home/ubuntu/services/mail

# Env
cp .env.example .env
# then edit .env and set:
#   RESEND_API_KEY=re_xxx       (from §2 step 3)
#   RESEND_WEBHOOK_SECRET=      (leave empty for now; fill in §5)

# Install + build
npm install
npm run build

# Install systemd unit
sudo cp hax429-mail.service /etc/systemd/system/hax429-mail.service
sudo systemctl daemon-reload
sudo systemctl enable --now hax429-mail

# Verify
systemctl status hax429-mail
curl -I http://localhost:3020/inbox      # expect HTTP/1.1 200
```

Logs: `journalctl -u hax429-mail -f`

Rebuild after code changes:
```bash
cd /home/ubuntu/services/mail && npm install && npm run build && sudo systemctl restart hax429-mail
```

---

## 4. nginx — point `mail.hax429.me` at this app

The existing site file currently proxies to Stalwart on `:8080`. Swap it for the version in this repo:

```bash
sudo cp /home/ubuntu/services/mail/nginx.conf /etc/nginx/sites-available/mail.hax429.me
sudo nginx -t
sudo systemctl reload nginx
```

After this, `https://mail.hax429.me` serves this app. The TLS cert at `/etc/letsencrypt/live/hax429.me/` covers it (same wildcard cert your other subdomains use — already on disk).

> If you want to keep Stalwart's webmail reachable during transition, give this app a different subdomain temporarily (e.g. `rmail.hax429.me`) — copy `nginx.conf`, change `server_name` and the `cp` target, and add an A/CNAME record.

---

## 5. Resend webhook (inbound)

This must happen *after* §4 because Resend needs a public HTTPS URL to deliver to.

1. Resend dashboard → **Webhooks → Add Endpoint**
   - URL: `https://mail.hax429.me/api/webhook`
   - Events: **`email.received`** (plus any `email.*` delivery events you want logged)
2. After creating, click the webhook → copy **Signing Secret** (starts with `whsec_…`).
3. Put it in `.env`:
   ```
   RESEND_WEBHOOK_SECRET=whsec_xxx
   ```
4. Restart:
   ```
   sudo systemctl restart hax429-mail
   ```
5. In the Resend dashboard, hit **Send test event** — you should see a 200 logged. Anything else (401 = secret mismatch; 500 = `RESEND_API_KEY` missing) means check `journalctl -u hax429-mail`.

---

## 6. Retire Stalwart + repoint MX

When the app is healthy and the webhook test passes:

```bash
# Confirm the unit name first
systemctl list-units --type=service | grep -i stalwart

sudo systemctl stop stalwart-mail
sudo systemctl disable stalwart-mail
```

Then in DNS, update the `hax429.me` MX record per §1 inbound table. Within ~15 min (depending on TTL) new mail will start hitting `/api/webhook` and appearing on the **Inbox** page.

Keep Stalwart's data dir around for a week or two in case something needs recovering.

---

## 7. (Optional) Send from Apple Mail / Thunderbird via Resend SMTP

Resend offers an SMTP relay if you'd rather send from a normal mail client instead of the **Compose** page:

| Field | Value |
|---|---|
| Server | `smtp.resend.com` |
| Port | `465` (SSL/TLS) or `587` (STARTTLS) |
| Username | `resend` |
| Password | your Resend API key (`re_…`) |
| From | any verified address, e.g. `me@hax429.me` |

There is **no IMAP/POP3** — clients can send but not fetch. That's what this web app is for.

---

## What's where

```
services/mail/
  app/
    layout.tsx              # nav + page shell
    page.tsx                # → /inbox
    inbox/page.tsx
    inbox/[id]/page.tsx
    sent/page.tsx           # live via resend.emails.list()
    compose/page.tsx        # form → /api/send
    api/webhook/route.ts    # Resend inbound posts here (Svix-signed)
    api/send/route.ts       # compose form posts here
  lib/
    db.ts                   # SQLite schema + helpers
    resend.ts               # SDK client + DEFAULT_FROM
  data/                     # SQLite file lives here (created on first run)
  hax429-mail.service       # systemd unit → /etc/systemd/system/
  nginx.conf                # nginx vhost → /etc/nginx/sites-available/mail.hax429.me
  .env.example
```

## Security notes

- The webhook verifies Svix signatures via `resend.webhooks.verify()` — unsigned/invalid posts return 401.
- Received HTML is rendered inside a `sandbox=""` iframe so it can't run scripts or steal cookies.
- **This app has no auth.** Once it's at `mail.hax429.me`, anyone who reaches the URL can read your inbox and send mail. Put it behind one of:
  - Cloudflare Access / Tailscale Funnel
  - nginx HTTP Basic auth (`auth_basic` + htpasswd) in the `location /` block — but leave `/api/webhook` open so Resend can still POST
  - IP allowlist via `allow`/`deny` directives
- `.env` contains the Resend API key — keep it `chmod 600` and out of git (it's in `.gitignore`).
