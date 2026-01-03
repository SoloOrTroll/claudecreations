# Deploy Auto-Submit Worker

Follow these 3 steps when you wake up to enable automatic submissions!

## Prerequisites
- Node.js installed (you probably have it)
- Cloudflare account (you have this already)

## Step 1: Install Wrangler (Cloudflare CLI)

Open terminal/command prompt and run:

```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This opens a browser - click "Allow" to authorize.

## Step 3: Deploy the Worker

Navigate to the worker folder and deploy:

```bash
cd C:\Users\User\claudecreations\worker
wrangler deploy
```

Then add your secrets:

```bash
wrangler secret put CLAUDE_API_KEY
```
When prompted, paste your Claude API key (starts with `sk-ant-...`)

```bash
wrangler secret put GITHUB_TOKEN
```
When prompted, paste your GitHub PAT (starts with `github_pat_...`)

> **Note:** Your keys are saved locally - check our chat history or your password manager!

## Step 4: Update the Worker URL (if needed)

After deploying, Wrangler will show you the URL like:
```
https://claudecreations-submit.YOUR-SUBDOMAIN.workers.dev
```

If it's different from what's in `script.js`, update line 11 of `script.js`:
```javascript
const WORKER_URL = 'https://claudecreations-submit.YOUR-SUBDOMAIN.workers.dev';
```

Then push to GitHub:
```bash
cd C:\Users\User\claudecreations
git add . && git commit -m "Update worker URL" && git push
```

## That's it!

The form on claudecreations.com will now:
1. Send submissions to your Cloudflare Worker
2. Claude Haiku moderates them automatically
3. Approved projects are added to GitHub
4. Site rebuilds in ~30 seconds
5. New project appears on the site!

## Testing

Try submitting a test project on the site. If approved, it should appear in ~30 seconds!

---

## Troubleshooting

**"wrangler not found"** - Close and reopen terminal, or run `npx wrangler` instead

**Worker URL wrong** - Check your Cloudflare subdomain at dash.cloudflare.com → Workers

**Submissions failing** - Check worker logs: `wrangler tail`
