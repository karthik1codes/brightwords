/**
 * Sign language video generation providers (AI-generated signing avatar).
 * Set SIGN_VIDEO_PROVIDER=isl (free), signspeak, or signapse and the corresponding config in .env.
 * See SIGN_VIDEO_SETUP.md for setup.
 */

const PROVIDER = (process.env.SIGN_VIDEO_PROVIDER || '').toLowerCase();
const SIGN_VIDEO_ISL_URL = (process.env.SIGN_VIDEO_ISL_URL || 'http://127.0.0.1:5001').replace(/\/$/, '');
const SIGNSPEAK_API_KEY = process.env.SIGNSPEAK_API_KEY || process.env.SIGN_SPEAK_API_KEY;
const SIGNSPEAK_API_BASE = (process.env.SIGNSPEAK_API_BASE_URL || process.env.SIGNSPEAK_API_BASE || 'https://api.sign-speak.com').replace(/\/$/, '');
const SIGNAPSE_API_KEY = process.env.SIGNAPSE_API_KEY;
const SIGNAPSE_API_BASE = (process.env.SIGNAPSE_API_BASE_URL || process.env.SIGNAPSE_API_BASE || 'https://api.signapse.ai').replace(/\/$/, '');

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 60; // ~2 min

async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 200)}`);
    }
    if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
    return data;
}

/**
 * Sign-Speak: ASL Production (batch).
 * Docs: https://app.theneo.io/sign-speak/sign-speak-api (submit batch, then retrieve batch result).
 * Base URL and paths may need to be updated per Sign-Speak's current API.
 */
async function signSpeakGenerate(text) {
    if (!SIGNSPEAK_API_KEY) throw new Error('SIGNSPEAK_API_KEY (or SIGN_SPEAK_API_KEY) is not set. Get a key at https://client.sign-speak.com');
    const submitUrl = `${SIGNSPEAK_API_BASE}/v1/asl-production`;
    const submitRes = await fetch(submitUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SIGNSPEAK_API_KEY}`,
            'X-API-Key': SIGNSPEAK_API_KEY,
        },
        body: JSON.stringify({ text: text.trim().slice(0, 500) }),
    });
    const submitText = await submitRes.text();
    let batch;
    try {
        batch = submitText ? JSON.parse(submitText) : {};
    } catch {
        throw new Error(`Sign-Speak submit failed (${submitRes.status}): ${submitText.slice(0, 200)}`);
    }
    if (!submitRes.ok) throw new Error(batch.message || batch.error || `Sign-Speak ${submitRes.status}`);
    const batchId = batch.batch_id || batch.batchId || batch.id;
    if (!batchId) throw new Error('Sign-Speak did not return a batch id. Check SIGNSPEAK_API_BASE_URL and API docs.');
    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        const result = await fetchJson(`${SIGNSPEAK_API_BASE}/v1/asl-production/${batchId}`, {
            headers: { 'Authorization': `Bearer ${SIGNSPEAK_API_KEY}`, 'X-API-Key': SIGNSPEAK_API_KEY },
        });
        const status = (result.status || result.state || '').toLowerCase();
        if (status === 'completed' || status === 'done' || result.video_url || result.videoUrl) {
            const url = result.video_url || result.videoUrl || result.url || result.output?.url;
            if (url) return { videoUrl: url };
        }
        if (status === 'failed' || status === 'error') throw new Error(result.message || result.error || 'Sign-Speak job failed');
    }
    throw new Error('Sign-Speak job timed out. Try shorter text or check provider status.');
}

/**
 * ISL (Indian Sign Language) free provider: Python server using IIITB VirtualISLInterpreter.
 * English text → ISL gloss → video (placeholder or concatenated clips). No API key.
 * Run: cd backend/sign-video-isl && pip install -r requirements.txt && python setup_isl.py && python server.py
 */
async function islGenerate(text) {
    const url = `${SIGN_VIDEO_ISL_URL}/translate`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim().slice(0, 500) }),
    });
    const textRes = await res.text();
    let data;
    try {
        data = textRes ? JSON.parse(textRes) : {};
    } catch {
        throw new Error(`ISL sign server returned invalid JSON. Is it running at ${SIGN_VIDEO_ISL_URL}? Run: cd backend/sign-video-isl && python server.py`);
    }
    if (!res.ok) throw new Error(data.error || `ISL server error ${res.status}`);
    const videoUrl = data.videoUrl;
    if (!videoUrl) throw new Error('ISL server did not return videoUrl');
    return { videoUrl };
}

/**
 * Signapse SignStream: text to BSL/ASL video.
 * Docs: https://docs.signapse.ai (when available). Contact Signapse for API base URL and auth.
 */
async function signapseGenerate(text) {
    if (!SIGNAPSE_API_KEY) throw new Error('SIGNAPSE_API_KEY is not set. Contact Signapse for API access.');
    const createUrl = `${SIGNAPSE_API_BASE}/v1/translate`; // placeholder path
    const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SIGNAPSE_API_KEY}`,
            'X-API-Key': SIGNAPSE_API_KEY,
        },
        body: JSON.stringify({ text: text.trim().slice(0, 500), output_format: 'video' }),
    });
    const createText = await createRes.text();
    let job;
    try {
        job = createText ? JSON.parse(createText) : {};
    } catch {
        throw new Error(`Signapse request failed (${createRes.status}): ${createText.slice(0, 200)}`);
    }
    if (!createRes.ok) throw new Error(job.message || job.error || `Signapse ${createRes.status}`);
    const jobId = job.job_id || job.jobId || job.id;
    if (!jobId) {
        if (job.video_url || job.videoUrl || job.url) return { videoUrl: job.video_url || job.videoUrl || job.url };
        throw new Error('Signapse did not return a job id or video URL. Check SIGNAPSE_API_BASE_URL and API docs.');
    }
    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        const result = await fetchJson(`${SIGNAPSE_API_BASE}/v1/jobs/${jobId}`, {
            headers: { 'Authorization': `Bearer ${SIGNAPSE_API_KEY}`, 'X-API-Key': SIGNAPSE_API_KEY },
        });
        const status = (result.status || result.state || '').toLowerCase();
        if (status === 'completed' || status === 'done' || result.video_url || result.videoUrl) {
            const url = result.video_url || result.videoUrl || result.url || result.output?.url;
            if (url) return { videoUrl: url };
        }
        if (status === 'failed' || status === 'error') throw new Error(result.message || result.error || 'Signapse job failed');
    }
    throw new Error('Signapse job timed out. Try shorter text or check provider status.');
}

/**
 * Generate a sign language video URL from text using the configured provider.
 * @param {string} text - Input text to translate to sign language video
 * @returns {Promise<{ videoUrl: string }>}
 */
async function generateSignVideo(text) {
    if (!text || typeof text !== 'string' || !text.trim()) throw new Error('Text is required');
    if (!PROVIDER) {
        throw new Error(
            'SIGN_VIDEO_PROVIDER is not set. Set it to "isl" (free), "signspeak", or "signapse" in backend .env. See backend/SIGN_VIDEO_SETUP.md'
        );
    }
    if (PROVIDER === 'isl') return islGenerate(text);
    if (PROVIDER === 'signspeak') return signSpeakGenerate(text);
    if (PROVIDER === 'signapse') return signapseGenerate(text);
    throw new Error(`Unknown SIGN_VIDEO_PROVIDER: ${process.env.SIGN_VIDEO_PROVIDER}. Use "isl", "signspeak", or "signapse".`);
}

function isSignVideoConfigured() {
    if (!PROVIDER) return false;
    if (PROVIDER === 'isl') return true;
    if (PROVIDER === 'signspeak') return !!SIGNSPEAK_API_KEY;
    if (PROVIDER === 'signapse') return !!SIGNAPSE_API_KEY;
    return false;
}

module.exports = { generateSignVideo, isSignVideoConfigured, SIGN_VIDEO_PROVIDER: PROVIDER };
