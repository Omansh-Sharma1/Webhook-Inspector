# Webhook Inspector

See exactly what a webhook sends — generate a disposable URL, drop it into any webhook configuration, and watch the raw request land live in a clean dashboard. No signup, no cost, no deploy-and-redeploy loop just to see a payload.

**Live demo:** `<add your Vercel URL here once deployed>`

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
│   └── favicon.png
├── src/
│   ├── components/
│   │   ├── Home.jsx         # Landing page — generate an inspector
│   │   ├── Dashboard.jsx    # /i/:slug — polling logic + two-pane layout
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
git clone https://github.com/<your-username>/webhook-inspector.git
cd webhook-inspector
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

This project needs the frontend and the `/api` serverless functions running together, so use the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

Open the printed URL (typically `http://localhost:3000`).

## Testing It

**Quick test with curl:**

```bash
curl -X POST http://localhost:3000/api/i/<your-slug> \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "value": 42}'
```

**Real-world test:** paste your deployed inspector URL into a GitHub repo's **Settings → Webhooks**, trigger an event (push a commit, open an issue), and watch it land without sending anything manually.

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
- **No authentication** — anyone with the inspector URL can view its captures. Fine for a disposable debugging tool, not intended for long-lived secrets.
- **48-hour expiry** — inspectors are meant to be temporary by design, not a permanent log store.

## Roadmap

- [ ] Request replay — resend a captured request's exact headers/body to a new URL
- [ ] Real-time updates via a free-tier pub/sub service instead of polling
- [ ] Side-by-side diff view between two captured requests
- [ ] Named/labeled inspectors instead of random slugs
- [ ] Export captured requests as JSON/HAR

## Built For — Digital Heroes Developer Trial Task

This project satisfies every stated requirement of the assignment:

- [x] **Actually works and produces real output** — captures and displays live HTTP requests end-to-end
- [x] **Solves a problem I personally hit** — debugging webhook payloads during open-source contributions
- [x] **Polished and complete rather than large and unfinished** — scoped deliberately to a focused MVP
- [x] **Deployed on Vercel** — frontend + serverless functions in a single deployment
- [x] **Public GitHub repository** — this repo
- [x] **No paid services** — Vercel Hobby tier + MongoDB Atlas free M0 tier only

## Author

**Name:** `<your name>`
**Email:** `<your email>`
**GitHub:** `<your GitHub profile link>`

## License

MIT — use this however you'd like.
(This text was a test for the webhook)
