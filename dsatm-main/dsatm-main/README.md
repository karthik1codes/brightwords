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

   **Optional – AI signing video:** To enable the "AI signing video" button (text → sign-language video): use the **free ISL** option (Indian Sign Language) by setting `SIGN_VIDEO_PROVIDER=isl` and running `backend/sign-video-isl/server.py` (after `python setup_isl.py`), or use a paid ASL/BSL provider (Sign-Speak/Signapse). See `backend/SIGN_VIDEO_SETUP.md` for details.

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

## Super Power (AWS AugmentAbility)

The **Super Power** section (Text-to-Speech with Amazon Polly, Transcribe, etc.) uses **AWS**. Use **Asia Pacific (Sydney)** `ap-southeast-2` to match your account and credits. **Full setup:** see `public/aws-augmentability-main/SETUP-AWS.md`. Short version: (1) Deploy `template.yml` in CloudFormation (region ap-southeast-2), (2) Run `node create-config.js` in that folder and enter the stack Outputs to generate `config.js`, (3) Sign in with the temporary password from your email. Then Polly and other Super Power features work.

The message *"AWS credentials not available"* appears because the app needs an AWS Cognito Identity Pool and User Pool to call services like Polly.

### How to get AWS credits / use AWS for free

1. **Create an AWS account** – [aws.amazon.com](https://aws.amazon.com) → Create an AWS Account.
2. **Free Tier** – New accounts get 12 months of free usage for many services (e.g. Amazon Polly, Transcribe within limits). No separate “credits” sign-up; Free Tier applies to your account.
3. **Educational / startup credits** – [AWS Educate](https://aws.amazon.com/education/awseducate/) or [AWS Activate](https://aws.amazon.com/activate/) can provide additional credits.

### How to fix "AWS credentials not available"

1. **Deploy the AWS stack**  
   In the [AWS CloudFormation console](https://console.aws.amazon.com/cloudformation), create a stack using:
   - **Template:** `public/aws-augmentability-main/template.yml`  
   Fill in the parameters (Region, Username, Email). After the stack completes, note the **Outputs**: `IdentityPoolId`, `UserPoolId`, `UserWebClientId`, `Region`.

2. **Create `config.js`**  
   In `public/aws-augmentability-main/`:
   - Copy `config.example.js` to `config.js`.
   - In `config.js`, set:
     - `appConfig.IdentityPoolId` = the Identity Pool ID from the stack Outputs.
     - `amplifyConfig.Auth.region`, `userPoolId`, `userPoolWebClientId` from the Outputs.
     - `amplifyConfig.Auth.oauth.domain` = `YOUR_CLIENT_ID.auth.YOUR_REGION.amazoncognito.com` (from Cognito User Pool → App integration → Domain name).

3. **Sign in (if required)**  
   The template creates a Cognito User Pool. Use the temporary password sent to the email you provided, or sign in via the Cognito Hosted UI when the app redirects you. After sign-in, Polly and other Super Power features should work.

Without `config.js` and a deployed stack, Super Power will show the credentials error; the rest of BrightWords (Sign Language, Fun Activities, etc.) does not need AWS.

## Development

- Frontend runs on port **8000**
- Backend runs on port **3000**
- Hot reload enabled for both frontend and backend

## License

See individual component licenses for details.


