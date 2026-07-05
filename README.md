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
| AI | Groq (Llama) — sign language tutor, activity hints, PDF text cleanup |
| Auth | Google OAuth 2.0 |
| Database | SQLite (local dev; stats/OTP routes) |
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

Copy env and add your Groq key:

```bash
cd backend
cp .env.example .env   # or .\create-env.ps1 on Windows
```

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
├── public/           Static assets + Sign Language translator build
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
