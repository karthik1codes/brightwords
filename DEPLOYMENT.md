# Deployment (Vercel — full stack)

BrightWords runs on **one Vercel project** with:

| Layer | How |
|--------|-----|
| **Frontend** | Vite build → `dist/` (static) |
| **Backend API** | Express `backend/server.js` via Vercel Web Service (`experimentalServices`) |
| **AI (Groq)** | `GROQ_API_KEY` in Vercel → Project → Settings → Environment Variables |

**Production URLs**

- https://brightwords-two.vercel.app (frontend + `/api/*`)
- https://brightwords.in (after DNS is pointed to Vercel)

## Hostinger DNS for brightwords.in

Your domain may still show a Hostinger waitlist page until DNS is updated.

In **Hostinger → Domains → brightwords.in → DNS**:

| Type | Name | Value |
|------|------|--------|
| **A** | `@` | `76.76.21.21` |
| **A** | `www` | `76.76.21.21` |

Remove conflicting A/CNAME records (e.g. Hostinger parking). Wait up to 24–48h for propagation.

Verify in [Vercel → brightwords → Domains](https://vercel.com/shashank-vas-projects/brightwords/settings/domains).

## Local development

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
npm run dev
```

## Limitations on Vercel

- **SQLite** uses `/tmp` on Vercel (stats/OTP reset on cold starts — fine for demos, not ideal for production data).
- **ISL sign-video Python server** does not run on Vercel; AI signing video needs a separate host or stays disabled in production.

## Redeploy

```bash
cd brightwords
vercel --prod --yes
```
