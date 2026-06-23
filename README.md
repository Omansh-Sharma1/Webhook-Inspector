# Webhook Inspector

See exactly what a webhook sends — generate a disposable URL, drop it into any webhook configuration, and watch the raw request land live in a clean dashboard. No signup, no cost, no deploy-and-redeploy loop just to see a payload.

**Live demo:** https://webhook-inspector-rose.vercel.app

---

## Why I Built This

While contributing to projects during GSSoC, I kept running into the same wall: integrating anything that communicates via webhooks (GitHub events, payment gateway callbacks, CI triggers) meant I had no fast way to see exactly what was being sent to my server — without deploying temporary logging code first, just to find out. That loop is slow and breaks flow for something that should take seconds.

Webhook Inspector fixes that specific gap: paste a generated URL into any webhook config, and the full request — headers, body, method, source IP, timestamp — shows up in a live dashboard the moment it arrives.

## What It Does

1. Generates a unique, disposable inspector URL on demand
2. Captures **any** HTTP request sent to that URL — any method, any content type
3. Displays captured requests in a live-updating dashboard, newest first
4. Lets you inspect full headers, query parameters, and body (auto-formatted if JSON) for each request
5. Automatically expires inspector data after 48 hours, so nothing accumulates indefinitely

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite, React Router |
| Backend | Node.js — Vercel Serverless Functions (no framework overhead) |
| Database | MongoDB Atlas (free M0 tier), with TTL indexing for automatic cleanup |
| Deployment | Vercel |
| Version control | Git / GitHub |

No paid services are used anywhere in this stack.

## How It Works

```
Sender (curl, Postman, or a real platform like GitHub/Stripe)
        │
        │  HTTP request, any method/body
        ▼
/api/i/[id]  →  catch-all serverless function
        │
        │  stores method, headers, body, query, IP, timestamp
        ▼
   MongoDB Atlas (requests collection)
        │
        │  polled every ~2.5s
        ▼
/api/requests/[id]  →  returns new captures since last poll
        │
        ▼
   React dashboard renders them live
```

The dashboard uses polling rather than WebSockets, since Vercel's serverless functions are stateless and can't hold a persistent connection open — polling is the simpler, honest choice for this scale of traffic.

## Project Structure

```
webhook-inspector/
├── api/
│   ├── generate.js          # POST → creates a new inspector, returns its slug
│   ├── i/[id].js            # Catch-all: captures any inbound HTTP request
│   └── requests/[id].js     # GET → polling endpoint for the dashboard
├── lib/
│   └── db.js                # MongoDB connection (cached across warm function invocations)
├── public/
│   └── logo.png
├── src/
│   ├── components/
│   │   ├── Home.jsx         # Landing page — generate an inspector
│   │   ├── Dashboard.jsx    # /i/:slug — polling logic + two-pane layout + submission badge
│   │   ├── RequestList.jsx  # Left panel: chronological list of captures
│   │   └── RequestDetail.jsx# Right panel: headers / query / body for one request
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vercel.json               # SPA routing — falls back to index.html for non-API routes
├── vite.config.js
├── package.json
└── .env.example
```

## Getting Started Locally

### 1. Clone and install

```bash
git clone https://github.com/Omansh-Sharma1/Webhook-Inspector.git
cd Webhook-Inspector
npm install
```

### 2. Set up MongoDB Atlas (free tier)

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free **M0** cluster
3. Under **Database Access**, create a user + password
4. Under **Network Access**, allow access from `0.0.0.0/0` (required since Vercel functions don't have a fixed IP)
5. Copy your connection string from **Connect → Drivers → Node.js**

### 3. Configure environment variables

```bash
cp .env.example .env
```

Paste your connection string into `.env`:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB=webhook_inspector
```

### 4. Run locally

This project needs the frontend and the `/api` serverless functions running together. Run these in **two separate terminals**:

```bash
npm install -g vercel
vercel dev
```

```bash
npm run dev
```

Open the URL `npm run dev` prints (typically `http://localhost:5173`) — it proxies `/api/*` calls through to `vercel dev` automatically.

## Testing It

**Quick test with curl:**

```bash
curl -X POST http://localhost:5173/api/i/<your-slug> \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "value": 42}'
```

**Real-world test (verified):** this tool has been tested against an actual GitHub repository webhook — both the automatic `ping` event GitHub sends on webhook creation, and a real `push` event triggered by a normal commit, landed correctly in the live dashboard with zero manual sending. Confirmed via GitHub's own **Recent Deliveries** log (`200` response) and by the distinguishing headers GitHub sends (`x-github-event`, `x-github-delivery`, `user-agent: GitHub-Hookshot/...`) showing up exactly as captured.

## Deployment

```bash
vercel
```

Then add `MONGODB_URI` (and optionally `MONGODB_DB`) under **Vercel dashboard → Project → Settings → Environment Variables**, and redeploy:

```bash
vercel --prod
```

## Design Decisions & Known Limitations

- **Polling, not WebSockets** — a deliberate choice given Vercel's stateless serverless functions; see "How It Works" above.
- **No webhook signature verification yet** — platforms like GitHub and Stripe support signing payloads with a shared secret (e.g. GitHub's `X-Hub-Signature-256` header) so a receiver can confirm a request genuinely came from them and wasn't spoofed. This project's webhook was tested with no secret configured, so signature verification isn't implemented in this version — see Roadmap.
- **No authentication** — anyone with the inspector URL can view its captures. Fine for a disposable debugging tool, not intended for long-lived secrets.
- **48-hour expiry** — inspectors are meant to be temporary by design, not a permanent log store.

## Roadmap

- [ ] Verify webhook signatures (HMAC) when a shared secret is configured, starting with GitHub's `X-Hub-Signature-256` scheme
- [ ] Request replay — resend a captured request's exact headers/body to a new URL
- [ ] Real-time updates via a free-tier pub/sub service instead of polling
- [ ] Side-by-side diff view between two captured requests
- [ ] Named/labeled inspectors instead of random slugs
- [ ] Export captured requests as JSON/HAR

## Built For — Digital Heroes Developer Trial Task

Mapped directly to the trial's stated mandatory requirements:

| Requirement | Status |
|---|---|
| Tool works and gives correct output | ✅ Verified locally, in production, and against a real GitHub `ping`/`push` webhook |
| Button labelled exactly "Built for Digital Heroes" → https://digitalheroesco.com | ✅ Visible in-app |
| Full name + a real, reachable email visible on the page | ✅ |
| Live and deployed on Vercel's free Hobby plan | ✅ https://webhook-inspector-rose.vercel.app |
| Public GitHub repository | ✅ this repo |
| Added to personal portfolio | ⬜ confirm before final submission |
| ₹0 spent, no paid subscriptions anywhere | ✅ Vercel Hobby tier + MongoDB Atlas M0 tier only |

## Author

**Name:** Omansh Sharma
**Email:** omansh210305@gmail.com
**GitHub:** https://github.com/Omansh-Sharma1

## License

MIT — use this however you'd like.
