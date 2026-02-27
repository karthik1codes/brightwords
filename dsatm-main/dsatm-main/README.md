# BrightWords

A comprehensive accessibility-focused web application with sign language learning and inclusive learning activities.

## Features

- 🔐 **Google Authentication** - Secure login with Google Sign-In
- 🤟 **Sign Language Learning** - Interactive sign language translation and learning (AI-powered)
- 🎮 **Fun Activities** - Phonics, Spelling, Story Creator, Story Explorer, Memory, Writing (AI hints)
- ♿ **Accessibility Features** - Built with accessibility in mind
- 🎨 **Modern React UI** - Responsive and user-friendly interface

## Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Node.js, Express
- **Database**: SQLite
- **AI**: Groq (Sign Language & Fun Activities)
- **Authentication**: Google OAuth 2.0

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dsatm
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Configure backend environment**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `.env` and add `GROQ_API_KEY` (optional; get one at https://console.groq.com). On Windows you can run `.\create-env.ps1` instead to create `.env` interactively.

### Running the Application

#### Option 1: Using Batch Files (Windows)

- **Start both servers**: Double-click `start-all.bat`
- **Start backend only**: Double-click `start-backend.bat` or `backend/start-server.bat`

#### Option 2: Manual Start

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:3000

## Project Structure

```
dsatm/
├── src/                    # React application source
│   ├── components/         # Reusable React components
│   ├── context/           # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   └── styles/            # CSS stylesheets
├── backend/               # Express API server
│   ├── server.js          # Main server file
│   └── app.db            # SQLite database
├── aws-augmentability-main/  # AWS AugmentAbility integration
└── dist/                  # Build output
```

## API Endpoints

- `GET /api/health` - Health check
- Auth, user stats, OTP – see `backend/server.js`
- `POST /api/sign-language/*` - Sign Language AI
- `POST /api/fun-activities/*` - Fun Activities AI (phonics, spelling, story, memory, writing)

## Development

- Frontend runs on port **8000**
- Backend runs on port **3000**
- Hot reload enabled for both frontend and backend

## License

See individual component licenses for details.


