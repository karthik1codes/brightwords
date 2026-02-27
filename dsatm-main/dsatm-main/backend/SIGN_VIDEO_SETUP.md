# AI-Generated Sign Language Video (Avatar)

BrightWords can generate **signing videos** from text. The Sign Language → Convert screen shows an **"AI signing video"** button when a provider is configured.

## Supported providers

| Provider   | Language | Cost | Notes |
|-----------|----------|------|--------|
| **isl**   | ISL (Indian) from English | **Free** | Uses [IIITB VirtualISLInterpreter](https://github.com/krishnshyam/VirtualISLInterpreter). No API key. Run `backend/sign-video-isl` server. |
| **Sign-Speak** | ASL (American) | Paid | API key from [client.sign-speak.com](https://client.sign-speak.com). REST API with batch submit + poll. |
| **Signapse**   | BSL/ASL        | Paid | Contact [Signapse](https://signapse.ai) for API access. SignStream converts text to sign video. |

## Backend configuration

In `backend/.env` add one of the following.

### ISL (free – Indian Sign Language)

1. Install Python 3.9+ and run the ISL sign-video server once:

   ```bash
   cd backend/sign-video-isl
   pip install -r requirements.txt
   python setup_isl.py
   python server.py
   ```

   Leave the server running (e.g. in a separate terminal). It listens on `http://127.0.0.1:5001` by default.

2. In `backend/.env`:

   ```env
   SIGN_VIDEO_PROVIDER=isl
   # Optional if the server runs on another host/port:
   # SIGN_VIDEO_ISL_URL=http://127.0.0.1:5001
   ```

3. Restart the BrightWords backend. The **"AI signing video"** button will appear; generated videos use **Indian Sign Language (ISL)** gloss from IIITB’s open-source translator.

### Sign-Speak (ASL)

```env
SIGN_VIDEO_PROVIDER=signspeak
SIGNSPEAK_API_KEY=your_api_key_here
# Optional if different from default:
# SIGNSPEAK_API_BASE_URL=https://api.sign-speak.com
```

Get an API key at [Sign-Speak developer portal](https://client.sign-speak.com). If their API base URL or paths differ from the default, set `SIGNSPEAK_API_BASE_URL` and we can adjust the paths in `backend/signVideoProviders.js` to match their docs.

### Signapse (BSL/ASL)

```env
SIGN_VIDEO_PROVIDER=signapse
SIGNAPSE_API_KEY=your_api_key_here
# Optional:
# SIGNAPSE_API_BASE_URL=https://api.signapse.ai
```

Contact Signapse for API keys and the correct base URL and endpoint paths. The current implementation uses placeholder paths (`/v1/translate`, `/v1/jobs/:id`); update `backend/signVideoProviders.js` when you have the real API spec.

## Flow

1. User enters or speaks text on the Sign Language **Convert** page.
2. Clicks **"AI signing video"** (only visible when a provider is configured).
3. Backend calls the configured provider (local, Sign-Speak, or Signapse), which returns a **video URL**.
4. The app opens a modal and plays the returned signing video.

## Optional: self-hosted / AWS GenASL

For a fully self-hosted pipeline (no per-minute API cost), you can deploy [AWS GenASL (genai-asl-avatar-generator)](https://github.com/aws-samples/genai-asl-avatar-generator), which uses Amazon Transcribe, Bedrock (for text→ASL gloss), and pre-generated avatar videos stitched by Lambda. To integrate with BrightWords:

1. Deploy GenASL per the repo’s README (S3, Step Functions, Lambda, DynamoDB, data prep with ASLLVD + RTMPose).
2. Expose an HTTP endpoint that accepts text and returns a video URL (or replicate their Step Functions + polling in your backend).
3. Add a new provider in `backend/signVideoProviders.js` (e.g. `genasl`) that calls your GenASL endpoint and set `SIGN_VIDEO_PROVIDER=genasl` in `.env`.

## Troubleshooting

- **"AI signing video" button not showing**  
  Backend must be running and `SIGN_VIDEO_PROVIDER` must be set (`isl`, `signspeak`, or `signapse`). For `isl`, the sign-video-isl server must be running. The frontend calls `GET /api/sign-language/video-enabled` to decide whether to show the button.

- **503 / "SIGN_VIDEO_PROVIDER is not set"**  
  Set `SIGN_VIDEO_PROVIDER=isl`, `signspeak`, or `signapse` in `backend/.env` (and API key for paid providers), then restart the backend.

- **Provider returns wrong status or no video URL**  
  Provider APIs vary. Check `backend/signVideoProviders.js`: update the submit/result URLs and response field names (`batch_id`, `video_url`, etc.) to match the provider’s current API documentation.
