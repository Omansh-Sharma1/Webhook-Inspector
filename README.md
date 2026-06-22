# Webhook Inspector

See exactly what a webhook sends — generate a disposable URL, drop it into any
webhook config, and watch the raw request (headers, body, method, everything)
land live in a dashboard. No signup, no cost, no deployment loop just to
debug a payload.

## Why this exists

Built after repeatedly hitting the same wall while integrating webhook-based
APIs during open-source work: there's no fast, free way to see exactly what a
third-party service sends you without deploying logging code first. This
fixes that.

## Stack

- **Frontend:** React + Vite, React Router
- **Backend:** Vercel serverless functions (plain Node, no framework)
- **Database:** MongoDB Atlas (free tier)
- **Deployment:** Vercel

## Project structure

```
webhook-inspector/
├── api/
│   ├── generate.js        # POST → creates a new inspector, returns its slug
│   ├── i/[id].js           # catch-all: captures ANY request sent to /api/i/:id
│   └── requests/[id].js    # GET → polling endpoint, returns captured requests
├── lib/
│   └── db.js               # MongoDB connection (cached across warm invocations)
├── src/
│   ├── components/
│   │   ├── Home.jsx         # landing page — generate an inspector
│   │   ├── Dashboard.jsx    # /i/:slug — polling + layout
│   │   ├── RequestList.jsx  # left panel: list of captured requests
│   │   └── RequestDetail.jsx# right panel: headers / query / body for one request
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vercel.json              # SPA routing fallback
├── vite.config.js
├── .env.example
└── package.json
```

## 1. Set up MongoDB Atlas (free tier)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a free M0 cluster (any region close to you)
3. Under **Database Access**, create a user with a username/password
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) —
   fine for a trial project; Vercel functions don't have static IPs
5. Click **Connect → Drivers → Node.js**, copy the connection string
6. (Optional but recommended) Create a TTL index so old data auto-deletes:
   - In Atlas, open your cluster's **Collections** tab
   - On the `requests` collection, add an index: `{ receivedAt: 1 }` with
     `expireAfterSeconds: 172800` (48 hours)
   - This keeps your free-tier storage from filling up — no cron job needed

## 2. Local setup

```bash
git clone <your-repo-url>
cd webhook-inspector
npm install

cp .env.example .env
# paste your MongoDB connection string into .env
```

## 3. Run it locally

This project needs **both** the Vite frontend and Vercel's serverless
functions running together, so use the Vercel CLI rather than plain `vite`:

```bash
npm install -g vercel
vercel dev
```

`vercel dev` serves the frontend AND runs your `/api` functions locally,
reading from `.env` automatically. Open the URL it prints (usually
`http://localhost:3000`).

> If you'd rather use `npm run dev` (plain Vite) for faster frontend
> iteration, run `vercel dev` in a second terminal on port 3000 — the Vite
> proxy in `vite.config.js` is already pointed there.

## 4. Test it

1. Open the app, click **Generate inspector URL**
2. Copy the `/api/i/<slug>` URL shown at the top of the dashboard
3. Send it a test request from another terminal:

```bash
curl -X POST https://your-deployment.vercel.app/api/i/<slug> \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "value": 42}'
```

4. Watch it land in the dashboard within ~2-3 seconds (polling interval)

For a more realistic test, paste the inspector URL into a real webhook
config — GitHub repo settings → Webhooks, or a payment gateway's test-mode
webhook URL — and trigger an event.

## 5. Deploy to Vercel

```bash
vercel
```

Follow the prompts (link to a new project). Then add your environment
variable in the Vercel dashboard:

**Project → Settings → Environment Variables**
- `MONGODB_URI` = your Atlas connection string
- `MONGODB_DB` = `webhook_inspector` (optional, has a default)

Redeploy after adding env vars:

```bash
vercel --prod
```

## 6. Push to GitHub

```bash
git add .
git commit -m "Initial commit: webhook inspector MVP"
git branch -M main
git remote add origin https://github.com/<your-username>/webhook-inspector.git
git push -u origin main
```

## Known limitations (MVP scope)

- **Polling, not real push:** the dashboard checks for new requests every
  2.5s rather than using WebSockets. Vercel serverless functions can't hold
  a persistent connection open, so polling is the simpler, honest choice
  here. See "Ideas to extend" below if you want to upgrade this.
- **No auth:** anyone with the inspector URL can view its captured
  requests. Fine for a disposable debugging tool; not meant for sensitive
  production secrets.
- **48-hour expiry:** inspectors and their data are meant to be temporary.

## Ideas to extend this yourself

Roughly in order of effort:

1. **Replay** — add a button that resends a captured request's exact
   headers/body to a new URL the user types in. Good demo feature.
2. **Real-time instead of polling** — swap the polling loop for a free-tier
   pub/sub service (e.g. Pusher, Ably) so the function pushes an event the
   moment a request lands.
3. **Diff view** — select two captured requests and show what changed
   between them (useful for "why did this payload change between retries").
4. **Named/labeled inspectors** — let users name an inspector ("Stripe
   test", "GitHub PRs") instead of just a random slug.
5. **Export** — download all captured requests for an inspector as a
   `.json` or `.har` file.

## License

MIT — do whatever you want with this.
