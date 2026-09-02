# BrightWords

**Live:** [brightwords.in](https://brightwords.in)

BrightWords is an accessibility-first learning app we built for kids and learners who need more than a one-size-fits-all classroom. Sign language support, voice navigation, PDF read-aloud, and a bunch of small games — phonics, spelling, stories, memory, writing — with AI help where it actually makes sense.

We started this because accessibility in edtech often feels like an afterthought. BrightWords is our attempt to put it up front.

## Founders

- **Shashank VA** — [shashankva.me](https://shashankva.me)
- **Karthik M** — [karthikme.in](https://karthikme.in)

## What's in the app

- Google sign-in
- Indian Sign Language (ISL) learning with an embedded translator + Groq-powered tutor chat
- Fun activities: Phonics, Spelling Wizard, Memory Master, Story Creator, Story Explorer, Writing Artist
- PDF Reader — upload a PDF, get the text extracted, hear it read word by word
- Voice assistance and screen-reader-friendly UI across the main flows
- Parent mode vs learner mode after login

## Tech stack

| Layer | Tools |
|-------|--------|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express |
| AI | Groq (`openai/gpt-oss-20b`) — sign language tutor, activity hints, PDF text cleanup |
| Auth | Google OAuth 2.0 |
| Database | Upstash Redis (production activity summaries); SQLite for legacy local OTP development |
| Hosting | Vercel (frontend + serverless API) |
| Sign video (optional) | Python ISL server in `backend/sign-video-isl/` |

Production runs a slim API on Vercel (`backend/vercelApp.js`). The full backend with SQLite lives in `backend/server.js` for local development.

## Run locally

**Prerequisites:** Node.js 18+, npm

```bash
git clone https://github.com/karthik1codes/brightwords.git
cd brightwords
npm install
cd backend && npm install && cd ..
```

Copy env and add the required production credentials:

```bash
cd backend
cp .env.example .env   # or .\create-env.ps1 on Windows
```

For production, configure these in Vercel (never as `VITE_*` variables):

```env
GROQ_API_KEY=...
SESSION_SECRET=a-long-random-server-only-secret
GOOGLE_CLIENT_ID=369705995460-d2f937r1bj3963upbmob113ngkf5v6og.apps.googleusercontent.com
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Google credentials are verified on the server. The browser stores no Google ID token; it uses a secure HttpOnly session cookie instead. Production activity summaries require an Upstash Redis database so learner records persist across serverless invocations.

**Terminal 1 — API (port 3000):**
```bash
cd backend
npm start
```

**Terminal 2 — frontend (port 8000):**
```bash
npm run dev
```

Open http://localhost:8000

Optional: ISL signing video needs the Python server — see `backend/SIGN_VIDEO_SETUP.md`.

## Project layout

```
brightwords/
├── src/              React app (pages, components, styles)
├── backend/          Express API, Groq helpers, sign-video-isl
├── api/              Vercel serverless entry
├── public/           Main app static assets only
├── signlanguage-app/ Separate Sign Language source; only its production build is deployed
└── vercel.json       Deploy config
```

## API (high level)

- `GET /api/health`
- `POST /api/sign-language/*` — explain, chat, normalize, gloss
- `POST /api/fun-activities/*` — phonics, spelling, stories, memory, writing
- `POST /api/pdf/extract-and-normalize` — PDF text extraction + read-aloud prep

Full route list is in `backend/server.js` (local) and `backend/vercelApp.js` (production).

## License

See individual component licenses where third-party code is included.
