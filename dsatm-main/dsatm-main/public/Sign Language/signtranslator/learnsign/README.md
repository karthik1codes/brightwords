# Sign Bridge - Sign Language Toolkit
**Sign Bridge** is a comprehensive web application designed to bridge communication gaps by providing tools for sign language learning, conversion, and video creation.
 This React-based platform enables users to convert speech or text into expressive sign language animations, learn signs through interactive 3D avatars, and create engaging sign language videos.

## 📋 Project Description

Sign Bridge is a full-featured sign language toolkit that combines cutting-edge web technologies with intuitive design to make sign language accessible to everyone. The application features real-time speech recognition, 3D avatar animations powered by Three.js, and a seamless user experience for learning, converting, and creating sign language content.

### Key Features

- **🔄 Convert**: Transform speech or text into sign language animations in real-time
  - Speech-to-sign conversion using browser's speech recognition API
  - Text-to-sign conversion with instant visualization
  - Customizable 3D avatar animations
  - Adjustable animation speed and pause duration

- **📚 Learn Sign**: Interactive learning platform for sign language
  - Browse extensive library of sign language animations
  - Learn individual letters (A-Z) and common words
  - Watch 3D avatar demonstrations with smooth animations
  - Practice at your own pace

- **🎥 Create Videos**: Generate sign language videos from content
  - Upload text files or type directly
  - Speak through microphone for audio input
  - Create professional sign language videos
  - Share videos with the community

- **🎨 Modern UI/UX**: Beautiful, responsive design
  - Animated landing page with smooth transitions
  - Gradient backgrounds and modern styling
  - Mobile-responsive layout
  - Intuitive navigation and user-friendly interface

### Technology Stack

- **Frontend Framework**: React 17.0.2
- **3D Graphics**: Three.js for 3D avatar rendering
- **Animations**: Framer Motion for smooth UI animations
- **Styling**: Bootstrap 5, CSS3 with custom gradients
- **Routing**: React Router DOM v6
- **Speech Recognition**: React Speech Recognition
- **HTTP Client**: Axios
- **3D Models**: GLTF format (xbot, ybot avatars)

### Project Structure

```
learnsign/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── Animations/    # Sign language animation data (alphabets, words)
│   │   ├── Assets/        # Images and static assets
│   │   ├── Components/    # Reusable React components
│   │   │   ├── Home/      # Landing page components
│   │   │   ├── Videos/    # Video-related components
│   │   │   └── ...
│   │   ├── Config/        # Configuration files (API endpoints)
│   │   ├── Models/        # 3D avatar models (GLTF files)
│   │   ├── Pages/         # Main page components
│   │   │   ├── Home.js    # Landing page
│   │   │   ├── Convert.js # Speech/text to sign conversion
│   │   │   ├── LearnSign.js # Learning interface
│   │   │   ├── Videos.js  # Video gallery
│   │   │   └── ...
│   │   └── App.js         # Main application component
│   └── package.json       # Dependencies and scripts
└── README.md              # Project documentation
```

### API Integration

The application communicates with a hosted backend API at `https://sign-kit-api.herokuapp.com/sign-kit` for video creation and management features. The frontend can also operate with local animation data for basic conversion and learning features.

### Main Pages

- **Home** (`/sign-kit/home`): Landing page with feature overview and call-to-action
- **Convert** (`/sign-kit/convert`): Real-time speech/text to sign language conversion
- **Learn Sign** (`/sign-kit/learn-sign`): Interactive learning interface for alphabets and words
- **Videos** (`/sign-kit/all-videos`): Browse and view created sign language videos
- **Create Video** (`/sign-kit/create-video`): Create new sign language videos from text/audio
- **Feedback** (`/sign-kit/feedback`): Submit feedback and suggestions
- **Login** (`/sign-kit/login`): User authentication (if implemented)

## Prerequisites

- **Node.js**: Version 16 LTS or later
- **npm**: Bundled with Node.js
- **Modern Browser**: Chrome or Edge recommended for speech recognition support
  - Speech recognition features require browser support (Chrome, Edge, Safari)
  - 3D graphics require WebGL support (available in all modern browsers)

## Installation

1. Open a terminal (Command Prompt or PowerShell on Windows).
2. Change into the client directory:
   ```bash
   cd E:\h1\learnsign\client
   ```
3. Install the project dependencies:
   ```bash
   npm install
   ```

## Running the Development Server

1. From `E:\h1\learnsign\client`, start the React development server:
   ```bash
   npm start
   ```
2. Wait for the build to finish. The app will automatically open at `http://localhost:3000`.
3. Navigate to the routed pages under the `/sign-kit` prefix, for example:
   - `http://localhost:3000/sign-kit/home`
   - `http://localhost:3000/sign-kit/convert`
   - `http://localhost:3000/sign-kit/learn-sign`

The development server provides hot reloading, so changes to the source files will refresh the browser automatically.

## Production Build

To create an optimized build suitable for deployment:

```bash
cd E:\h1\learnsign\client
npm run build
```

The production files will be generated in `client/build/`.

## Configuration

### API Configuration

The API base URL is configured in `src/Config/config.js`:
```javascript
export const baseURL = 'https://sign-kit-api.herokuapp.com/sign-kit'
```

To use a different API endpoint, modify this file.

### Browser Requirements

- **Speech Recognition**: Requires Chrome, Edge, or Safari (not available in Firefox)
- **3D Graphics**: Requires WebGL support (available in all modern browsers)
- **HTTPS**: Speech recognition requires HTTPS in production (localhost works in development)

## Features in Detail

### Convert Page
- Real-time speech recognition using browser's Web Speech API
- Text input for manual conversion
- 3D avatar selection (xbot or ybot)
- Animation speed and pause duration controls
- Smooth character-by-character sign language animation

### Learn Sign Page
- Interactive alphabet learning (A-Z)
- Common words library (HOME, PERSON, TIME, YOU, etc.)
- 3D avatar demonstrations
- Repeat and practice functionality

### Video Creation
- Multiple input methods: text file upload, text input, or speech
- Automatic video generation from content
- Video gallery and sharing capabilities
- Community video browsing

## Troubleshooting

- If `npm start` fails, ensure dependencies are installed (`npm install`) and no other process is using port 3000.
- Delete `client/node_modules` and re-run `npm install` if you encounter dependency inconsistencies.


