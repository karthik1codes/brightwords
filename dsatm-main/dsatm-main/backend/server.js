const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Configure CORS to allow requests from main app and Sign Language client
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:9000', 'http://localhost:3001', 'http://localhost:8001', 'http://127.0.0.1:8001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// IMPORTANT: API routes must be registered BEFORE static files
// This ensures /api/* routes never fall through to static file serving

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        // User stats table (supports both email and unified_user_id)
        db.run(`CREATE TABLE IF NOT EXISTS user_stats (
            user_email TEXT PRIMARY KEY,
            unified_user_id TEXT,
            user_name TEXT,
            total_points INTEGER DEFAULT 0,
            lessons_complete INTEGER DEFAULT 0,
            achievements INTEGER DEFAULT 0,
            time_spent INTEGER DEFAULT 0,
            streak INTEGER DEFAULT 0,
            last_activity TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating user_stats table:', err.message);
            } else {
                console.log('User stats table ready');
                // Add unified_user_id column if it doesn't exist (for existing databases)
                db.run(`ALTER TABLE user_stats ADD COLUMN unified_user_id TEXT`, () => {
                    // Ignore error if column already exists
                });
            }
        });

        // Users table for unified identity (phone + Google linking)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT UNIQUE,
            user_name TEXT,
            phone_number TEXT UNIQUE,
            linked_google_email TEXT,
            unified_user_id TEXT UNIQUE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table ready');
            }
        });

        // OTP storage table
        db.run(`CREATE TABLE IF NOT EXISTS otp_storage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL,
            otp TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            attempts INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating otp_storage table:', err.message);
            } else {
                console.log('OTP storage table ready');
            }
        });

        // OTP rate limiting table
        db.run(`CREATE TABLE IF NOT EXISTS otp_rate_limit (
            phone_number TEXT PRIMARY KEY,
            request_count INTEGER DEFAULT 1,
            first_request_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_request_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating otp_rate_limit table:', err.message);
            } else {
                console.log('OTP rate limit table ready');
            }
        });
    }
});

// ========== Groq LLM helper for Sign Language AI features (free tier: Llama 3.1 8B, etc.) ==========
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'; // free tier; or llama-3.3-70b-versatile, qwen2-72b-instant
const GROQ_BASE = 'https://api.groq.com/openai/v1';

async function llmChat(systemPrompt, userMessage, maxTokens = 300) {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not set in environment. Get a free key at https://console.groq.com');
    }
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            max_tokens: maxTokens,
            temperature: 0.4,
        }),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq API error ${res.status}: ${errText}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty response from Groq');
    return content;
}

// Known signs (words + letters) for prompts
const KNOWN_WORDS = ['TIME', 'HOME', 'PERSON', 'YOU'];

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'BrightWords Subscription API is running' });
});

// Helper to get user by unified_user_id or email
function getUserByIdentifier(unifiedUserId, email, cb) {
    if (unifiedUserId) {
        db.get('SELECT * FROM users WHERE unified_user_id = ?', [unifiedUserId], (err, user) => {
            if (err) return cb(err);
            cb(null, user);
        });
    } else if (email) {
        db.get('SELECT * FROM users WHERE user_email = ? OR linked_google_email = ?', [email.toLowerCase(), email.toLowerCase()], (err, user) => {
            if (err) return cb(err);
            cb(null, user);
        });
    } else {
        cb(null, null);
    }
}

// Helpers for stats (now supports unified_user_id)
function getOrCreateStats(email, name, unifiedUserId, cb) {
    // If unifiedUserId is provided, use it to find the user's email
    if (unifiedUserId) {
        getUserByIdentifier(unifiedUserId, null, (userErr, user) => {
            if (userErr) return cb(userErr);
            
            // Use the user's email if available, otherwise use unified_user_id as identifier
            const identifier = user?.user_email || user?.linked_google_email || `user_${unifiedUserId}@brightwords.local`;
            const safeEmail = identifier.toLowerCase();
            
            db.get('SELECT * FROM user_stats WHERE user_email = ? OR unified_user_id = ?', [safeEmail, unifiedUserId], (err, row) => {
                if (err) return cb(err);
                if (row) {
                    // Update unified_user_id if missing
                    if (!row.unified_user_id && unifiedUserId) {
                        db.run('UPDATE user_stats SET unified_user_id = ? WHERE user_email = ?', [unifiedUserId, row.user_email], () => {});
                    }
                    return cb(null, row);
                }
                const now = new Date().toISOString().slice(0, 10);
                db.run(
                    `INSERT INTO user_stats (user_email, unified_user_id, user_name, streak, last_activity) VALUES (?, ?, ?, ?, ?)`,
                    [safeEmail, unifiedUserId, name || '', 1, now],
                    function (insertErr) {
                        if (insertErr) return cb(insertErr);
                        db.get('SELECT * FROM user_stats WHERE user_email = ?', [safeEmail], cb);
                    }
                );
            });
        });
    } else {
        // Legacy email-based lookup
        const safeEmail = (email || '').toLowerCase();
        if (!safeEmail) return cb(new Error('Email or unified_user_id is required'));
        
        // Try to find unified_user_id from users table
        getUserByIdentifier(null, safeEmail, (userErr, user) => {
            const userId = user?.unified_user_id || null;
            
            db.get('SELECT * FROM user_stats WHERE user_email = ? OR unified_user_id = ?', [safeEmail, userId], (err, row) => {
                if (err) return cb(err);
                if (row) {
                    // Update unified_user_id if missing
                    if (!row.unified_user_id && userId) {
                        db.run('UPDATE user_stats SET unified_user_id = ? WHERE user_email = ?', [userId, row.user_email], () => {});
                    }
                    return cb(null, row);
                }
                const now = new Date().toISOString().slice(0, 10);
                db.run(
                    `INSERT INTO user_stats (user_email, unified_user_id, user_name, streak, last_activity) VALUES (?, ?, ?, ?, ?)`,
                    [safeEmail, userId, name || '', 1, now],
                    function (insertErr) {
                        if (insertErr) return cb(insertErr);
                        db.get('SELECT * FROM user_stats WHERE user_email = ?', [safeEmail], cb);
                    }
                );
            });
        });
    }
}

function computeStreak(row) {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (!row.last_activity) {
        return { streak: 1, last_activity: todayStr };
    }
    const last = new Date(row.last_activity);
    const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
        return { streak: row.streak, last_activity: todayStr };
    }
    if (diffDays === 1) {
        return { streak: row.streak + 1, last_activity: todayStr };
    }
    // missed a day
    return { streak: 1, last_activity: todayStr };
}

// Get stats (supports email or unified_user_id)
app.get('/api/stats/:identifier', (req, res) => {
    const identifier = req.params.identifier || '';
    const name = req.query.name || '';
    const unifiedUserId = req.query.unifiedUserId || null;
    
    // Check if identifier is an email or unified_user_id
    const isEmail = identifier.includes('@');
    const email = isEmail ? identifier.toLowerCase() : null;
    const userId = isEmail ? null : identifier;
    
    getOrCreateStats(email, name, unifiedUserId || userId, (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch stats' });
        }
        const computed = computeStreak(row);
        const updateField = row.unified_user_id ? 'unified_user_id' : 'user_email';
        const updateValue = row.unified_user_id || email;
        
        db.run(
            `UPDATE user_stats SET streak = ?, last_activity = ?, updated_at = CURRENT_TIMESTAMP WHERE ${updateField} = ?`,
            [computed.streak, computed.last_activity, updateValue],
            (uErr) => {
                if (uErr) {
                    return res.status(500).json({ error: 'Failed to update streak' });
                }
                return res.json({
                    user_email: row.user_email,
                    unified_user_id: row.unified_user_id,
                    user_name: row.user_name,
                    total_points: row.total_points,
                    lessons_complete: row.lessons_complete,
                    achievements: row.achievements,
                    time_spent: row.time_spent,
                    streak: computed.streak,
                    last_activity: computed.last_activity
                });
            }
        );
    });
});

// Update stats (incremental) - supports unified_user_id
app.post('/api/stats/update', (req, res) => {
    const { userEmail, userName, totalPoints = 0, lessonsComplete = 0, achievements = 0, timeSpent = 0, unifiedUserId } = req.body || {};
    const email = (userEmail || '').toLowerCase();
    if (!email && !unifiedUserId) {
        return res.status(400).json({ error: 'userEmail or unifiedUserId is required' });
    }
    getOrCreateStats(email, userName, unifiedUserId, (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch stats' });
        }
        const computed = computeStreak(row);
        const newTotals = {
            total_points: row.total_points + Number(totalPoints || 0),
            lessons_complete: row.lessons_complete + Number(lessonsComplete || 0),
            achievements: row.achievements + Number(achievements || 0),
            time_spent: row.time_spent + Number(timeSpent || 0),
            streak: computed.streak,
            last_activity: computed.last_activity
        };
        const updateField = row.unified_user_id ? 'unified_user_id' : 'user_email';
        const updateValue = row.unified_user_id || email;
        
        db.run(
            `UPDATE user_stats
             SET total_points = ?, lessons_complete = ?, achievements = ?, time_spent = ?, streak = ?, last_activity = ?, user_name = ?, updated_at = CURRENT_TIMESTAMP
             WHERE ${updateField} = ?`,
            [
                newTotals.total_points,
                newTotals.lessons_complete,
                newTotals.achievements,
                newTotals.time_spent,
                newTotals.streak,
                newTotals.last_activity,
                userName || row.user_name || '',
                updateValue
            ],
            (uErr) => {
                if (uErr) {
                    return res.status(500).json({ error: 'Failed to update stats' });
                }
                return res.json({
                    user_email: row.user_email,
                    unified_user_id: row.unified_user_id,
                    ...newTotals
                });
            }
        );
    });
});

// ============================================
// FREE SMS OTP AUTHENTICATION (TextLocal/Console)
// ============================================

// Helper function to generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Free SMS sending using TextLocal API (free tier for India)
// Falls back to console logging if API key not configured
async function sendSMS(phoneNumber, otp) {
    const { TEXTLOCAL_API_KEY } = process.env;
    
    // If TextLocal API key is not configured, log to console (free development mode)
    if (!TEXTLOCAL_API_KEY) {
        console.log('\n========================================');
        console.log('📱 OTP FOR DEVELOPMENT (FREE MODE)');
        console.log('========================================');
        console.log(`Phone: ${phoneNumber}`);
        console.log(`OTP: ${otp}`);
        console.log('========================================\n');
        return Promise.resolve({ success: true, mode: 'console' });
    }
    
    // Use TextLocal API (free tier: 100 SMS/day for India)
    try {
        const https = require('https');
        const querystring = require('querystring');
        
        const message = `Your BrightWords OTP is ${otp}. Valid for 5 minutes.`;
        const data = querystring.stringify({
            apikey: TEXTLOCAL_API_KEY,
            numbers: phoneNumber.replace(/\+/g, ''), // Remove + for TextLocal
            message: message,
            sender: 'TXTLCL' // TextLocal default sender
        });
        
        const options = {
            hostname: 'api.textlocal.in',
            path: '/send/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length
            }
        };
        
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        const result = JSON.parse(responseData);
                        if (result.status === 'success') {
                            console.log(`[SMS] OTP sent via TextLocal to ${phoneNumber}`);
                            resolve({ success: true, mode: 'textlocal', result });
                        } else {
                            console.warn(`[SMS] TextLocal error: ${result.errors?.[0]?.message || 'Unknown error'}`);
                            // Fallback to console logging
                            console.log(`\n📱 OTP (TextLocal failed): ${otp} for ${phoneNumber}\n`);
                            resolve({ success: true, mode: 'console-fallback' });
                        }
                    } catch (e) {
                        console.warn('[SMS] TextLocal response parse error:', e);
                        console.log(`\n📱 OTP (fallback): ${otp} for ${phoneNumber}\n`);
                        resolve({ success: true, mode: 'console-fallback' });
                    }
                });
            });
            
            req.on('error', (error) => {
                console.warn('[SMS] TextLocal request error:', error.message);
                console.log(`\n📱 OTP (network error fallback): ${otp} for ${phoneNumber}\n`);
                resolve({ success: true, mode: 'console-fallback' });
            });
            
            req.write(data);
            req.end();
        });
    } catch (error) {
        console.warn('[SMS] TextLocal error:', error);
        console.log(`\n📱 OTP (error fallback): ${otp} for ${phoneNumber}\n`);
        return Promise.resolve({ success: true, mode: 'console-fallback' });
    }
}

// POST /api/auth/send-otp
app.post('/api/auth/send-otp', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    console.log('[API] POST /api/auth/send-otp - Request received');
    
    const { phoneNumber } = req.body;
    
    // Validate phone number
    if (!phoneNumber) {
        return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    
    // Normalize phone number
    const normalizedPhone = phoneNumber.replace(/\s/g, '').replace(/-/g, '');
    
    // Basic validation: should have at least 10 digits
    const digits = normalizedPhone.replace(/\D/g, '');
    if (digits.length < 10) {
        return res.status(400).json({ success: false, error: 'Phone number must have at least 10 digits' });
    }
    
    // Format phone number (ensure + prefix)
    const formattedPhone = normalizedPhone.startsWith('+') ? normalizedPhone : `+${normalizedPhone}`;
    
    console.log('[API] Normalized phone:', formattedPhone);
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    console.log('[API] Generated OTP:', otp, 'for phone:', formattedPhone);
    
    // Delete old OTPs for this phone number
    db.run('DELETE FROM otp_storage WHERE phone_number = ?', [formattedPhone], (deleteErr) => {
        if (deleteErr) {
            console.error('[API] Error deleting old OTPs:', deleteErr);
            return res.status(500).json({ success: false, error: 'Failed to clear old OTPs' });
        }
        
        // Store new OTP
        db.run(
            'INSERT INTO otp_storage (phone_number, otp, expires_at) VALUES (?, ?, ?)',
            [formattedPhone, otp, expiresAt.toISOString()],
            async (insertErr) => {
                if (insertErr) {
                    console.error('[API] Error storing OTP:', insertErr);
                    return res.status(500).json({ success: false, error: 'Failed to store OTP' });
                }
                
                // Send SMS (free provider with console fallback)
                try {
                    const smsResult = await sendSMS(formattedPhone, otp);
                    console.log('[API] OTP sent successfully:', smsResult.mode);
                    res.json({ 
                        success: true, 
                        otpSent: true, 
                        message: 'OTP sent successfully',
                        mode: smsResult.mode // 'console', 'textlocal', or 'console-fallback'
                    });
                } catch (smsErr) {
                    console.error('[API] SMS sending error:', smsErr);
                    // Still return success if OTP is stored (user can see it in console)
                    res.json({ 
                        success: true, 
                        otpSent: true, 
                        message: 'OTP generated. Check console for OTP.',
                        mode: 'console'
                    });
                }
            }
        );
    });
});

// Helper function to get or create unified user
function getOrCreateUnifiedUser(phoneNumber, googleEmail, callback) {
    // First, check if phone number exists
    db.get('SELECT * FROM users WHERE phone_number = ?', [phoneNumber], (err, phoneUser) => {
        if (err) return callback(err);
        
        if (phoneUser) {
            // Phone number exists - check if we need to link Google email
            if (googleEmail && !phoneUser.linked_google_email) {
                db.run(
                    'UPDATE users SET linked_google_email = ?, updated_at = CURRENT_TIMESTAMP WHERE phone_number = ?',
                    [googleEmail, phoneNumber],
                    (updateErr) => {
                        if (updateErr) return callback(updateErr);
                        db.get('SELECT * FROM users WHERE phone_number = ?', [phoneNumber], callback);
                    }
                );
            } else {
                callback(null, phoneUser);
            }
        } else {
            // Phone number doesn't exist - check if Google email exists
            if (googleEmail) {
                db.get('SELECT * FROM users WHERE user_email = ? OR linked_google_email = ?', [googleEmail, googleEmail], (emailErr, emailUser) => {
                    if (emailErr) return callback(emailErr);
                    
                    if (emailUser) {
                        // Google email exists - link phone number
                        db.run(
                            'UPDATE users SET phone_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                            [phoneNumber, emailUser.id],
                            (linkErr) => {
                                if (linkErr) return callback(linkErr);
                                db.get('SELECT * FROM users WHERE id = ?', [emailUser.id], callback);
                            }
                        );
                    } else {
                        // Neither exists - create new user
                        const unifiedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        db.run(
                            'INSERT INTO users (user_email, phone_number, unified_user_id) VALUES (?, ?, ?)',
                            [googleEmail, phoneNumber, unifiedUserId],
                            function(createErr) {
                                if (createErr) return callback(createErr);
                                db.get('SELECT * FROM users WHERE id = ?', [this.lastID], callback);
                            }
                        );
                    }
                });
            } else {
                // No Google email - create new user with phone only
                const unifiedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                db.run(
                    'INSERT INTO users (phone_number, unified_user_id) VALUES (?, ?)',
                    [phoneNumber, unifiedUserId],
                    function(createErr) {
                        if (createErr) return callback(createErr);
                        db.get('SELECT * FROM users WHERE id = ?', [this.lastID], callback);
                    }
                );
            }
        }
    });
}

// POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    console.log('[API] POST /api/auth/verify-otp - Request received');
    
    const { phoneNumber, otp, googleEmail } = req.body;
    
    // Validate inputs
    if (!phoneNumber || !otp) {
        return res.status(400).json({ success: false, error: 'Phone number and OTP are required' });
    }
    
    if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ success: false, error: 'OTP must be 6 digits' });
    }
    
    const normalizedPhone = phoneNumber.replace(/\s/g, '').replace(/-/g, '');
    const formattedPhone = normalizedPhone.startsWith('+') ? normalizedPhone : `+${normalizedPhone}`;
    
    // Find OTP record
    db.get(
        'SELECT * FROM otp_storage WHERE phone_number = ? AND otp = ?',
        [formattedPhone, otp],
        (err, otpRecord) => {
            if (err) {
                console.error('[API] Error verifying OTP:', err);
                return res.status(500).json({ success: false, error: 'Failed to verify OTP' });
            }
            
            if (!otpRecord) {
                // Increment attempts
                db.run(
                    'UPDATE otp_storage SET attempts = attempts + 1 WHERE phone_number = ?',
                    [formattedPhone],
                    () => {}
                );
                return res.status(400).json({ success: false, error: 'Invalid OTP' });
            }
            
            // Check expiry
            const expiresAt = new Date(otpRecord.expires_at);
            if (new Date() > expiresAt) {
                db.run('DELETE FROM otp_storage WHERE id = ?', [otpRecord.id], () => {});
                return res.status(400).json({ success: false, error: 'OTP has expired' });
            }
            
            // Check attempts (max 5)
            if (otpRecord.attempts >= 5) {
                db.run('DELETE FROM otp_storage WHERE id = ?', [otpRecord.id], () => {});
                return res.status(400).json({ success: false, error: 'Too many failed attempts. Please request a new OTP.' });
            }
            
            // OTP is valid - get or create unified user
            getOrCreateUnifiedUser(formattedPhone, googleEmail ? googleEmail.toLowerCase() : null, (userErr, user) => {
                if (userErr) {
                    console.error('[API] Error creating user:', userErr);
                    return res.status(500).json({ success: false, error: 'Failed to create user session' });
                }
                
                // Delete used OTP
                db.run('DELETE FROM otp_storage WHERE id = ?', [otpRecord.id], () => {});
                
                // Generate a simple token (in production, use JWT)
                const token = crypto.createHash('sha256')
                    .update(`${user.unified_user_id}_${Date.now()}`)
                    .digest('hex');
                
                console.log('[API] OTP verified successfully for:', formattedPhone);
                
                // Return user data and token
                res.json({
                    success: true,
                    token,
                    user: {
                        unifiedUserId: user.unified_user_id,
                        email: user.user_email || null,
                        phoneNumber: user.phone_number,
                        linkedGoogleEmail: user.linked_google_email || null,
                        name: user.user_name || null
                    }
                });
            });
        }
    );
});

// ========== Sign Language AI (Groq) routes ==========

app.post('/api/sign-language/explain', async (req, res) => {
    try {
        const { type, value } = req.body || {};
        if (!value || typeof value !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid body: { type, value }' });
        }
        const kind = type === 'letter' ? 'letter' : 'word';
        const systemPrompt = 'You are a friendly Indian Sign Language (ISL) tutor. In 1 to 2 short sentences, explain how to perform or remember this sign. Use simple, clear language. Do not use markdown.';
        const userMessage = kind === 'letter'
            ? `Explain the sign for the letter "${value.toUpperCase()}" (single character).`
            : `Explain the sign for the word "${value.toUpperCase()}".`;
        const explanation = await llmChat(systemPrompt, userMessage, 150);
        return res.json({ explanation });
    } catch (err) {
        console.error('Sign-language explain error:', err.message);
        return res.status(500).json({
            error: err.message || 'Failed to get explanation',
            details: GROQ_API_KEY ? undefined : 'GROQ_API_KEY not set in backend .env',
        });
    }
});

app.post('/api/sign-language/normalize', async (req, res) => {
    try {
        const { text } = req.body || {};
        if (typeof text !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid body: { text }' });
        }
        const systemPrompt = `You are a text normalizer for a sign language app. We have full signs only for these words: ${KNOWN_WORDS.join(', ')}. All other words are fingerspelled letter by letter.
Tasks: (1) Normalize the user text: fix typos, expand contractions (e.g. "gonna" -> "going to"), correct grammar. (2) List which words from the user text are in our sign list (${KNOWN_WORDS.join(', ')}).
Respond in exactly this JSON format, no other text: {"normalizedText":"...", "suggestedWords":["WORD1","WORD2"], "message":"Short hint for the user about which words have full signs."}`;
        const raw = await llmChat(systemPrompt, `User text: ${text}`, 250);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch) : { normalizedText: text, suggestedWords: [], message: '' };
        const normalizedText = parsed.normalizedText || text;
        const suggestedWords = Array.isArray(parsed.suggestedWords) ? parsed.suggestedWords : [];
        const message = parsed.message || (suggestedWords.length ? `We have full signs for: ${suggestedWords.join(', ')}.` : '');
        return res.json({ normalizedText, suggestedWords, message });
    } catch (err) {
        console.error('Sign-language normalize error:', err.message);
        return res.status(500).json({
            error: err.message || 'Failed to normalize',
            normalizedText: req.body?.text || '',
            suggestedWords: [],
            message: '',
        });
    }
});

app.post('/api/sign-language/gloss', async (req, res) => {
    try {
        const { text } = req.body || {};
        if (typeof text !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid body: { text }' });
        }
        const systemPrompt = `You are an Indian Sign Language (ISL) expert. Given an English sentence, output a sequence of sign glosses (one per sign). Use CAPITALIZED words for known signs. For fingerspelling, use single capital letters separated by spaces.
Our app has full signs only for these words: ${KNOWN_WORDS.join(', ')}. For any other word, either use a standard ISL gloss if you know one, or output the letters for fingerspelling (e.g. "J O H N").
Respond with a JSON array only, no other text. Example: ["HELLO","MY","NAME","J","O","H","N"]`;
        const raw = await llmChat(systemPrompt, `Sentence: ${text}`, 200);
        const arrMatch = raw.match(/\[[\s\S]*\]/);
        const glosses = arrMatch ? JSON.parse(arrMatch) : [];
        return res.json({ glosses: Array.isArray(glosses) ? glosses : [] });
    } catch (err) {
        console.error('Sign-language gloss error:', err.message);
        return res.status(500).json({ error: err.message || 'Failed to get glosses', glosses: [] });
    }
});

app.post('/api/sign-language/chat', async (req, res) => {
    try {
        const { message } = req.body || {};
        if (typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: 'Missing or invalid body: { message }' });
        }
        const systemPrompt = `You are a friendly Indian Sign Language (ISL) tutor for the BrightWords app. We have signs for: letters A-Z, and these words: ${KNOWN_WORDS.join(', ')}. For other concepts, suggest fingerspelling or a short explanation. Keep answers brief (2-4 sentences). Do not use markdown. If the user asks about a sign we have, suggest they try "Learn Sign" for that word or letter.`;
        const reply = await llmChat(systemPrompt, message.trim(), 200);
        return res.json({ reply });
    } catch (err) {
        console.error('Sign-language chat error:', err.message);
        return res.status(500).json({ error: err.message || 'Failed to get reply', reply: '' });
    }
});

// ========== Fun Activities AI (Groq) routes ==========

app.post('/api/fun-activities/phonics-explain', async (req, res) => {
    try {
        const { letter } = req.body || {};
        const L = typeof letter === 'string' ? letter.trim().toUpperCase() : '';
        if (!L || L.length !== 1 || !/^[A-Z]$/.test(L)) {
            return res.status(400).json({ error: 'Missing or invalid body: { letter: "A"-"Z" }' });
        }
        const systemPrompt = 'You are a friendly phonics tutor for children. In 1 to 2 short sentences, explain how to make or remember the sound for this letter. Use simple language. Do not use markdown.';
        const explanation = await llmChat(systemPrompt, `Explain the sound for the letter ${L}.`, 150);
        return res.json({ explanation });
    } catch (err) {
        console.error('Fun-activities phonics-explain error:', err.message);
        return res.status(500).json({ error: err.message || 'Failed to get explanation', explanation: '' });
    }
});

app.post('/api/fun-activities/spelling-words', async (req, res) => {
    try {
        const level = (req.body?.level || 'easy').toLowerCase();
        const topic = (req.body?.topic || 'everyday').toLowerCase();
        const systemPrompt = `You are a spelling practice helper. Return a JSON array of exactly 8 simple English words suitable for spelling practice. Level: ${level}. Topic: ${topic}. Use only lowercase, short words (e.g. cat, run, sun). Reply with ONLY a JSON array, no other text. Example: ["cat","dog","sun","hat","run","bug","pet","red"]`;
        const raw = await llmChat(systemPrompt, `Generate 8 words for level=${level} topic=${topic}.`, 150);
        const arrMatch = raw.match(/\[[\s\S]*?\]/);
        const words = arrMatch ? JSON.parse(arrMatch) : ['cat', 'dog', 'sun', 'hat', 'run', 'bug', 'pet', 'red'];
        const list = Array.isArray(words) ? words.filter(w => typeof w === 'string').map(w => w.toLowerCase().trim()).slice(0, 12) : ['cat', 'dog', 'sun', 'hat', 'run', 'bug', 'pet', 'red'];
        return res.json({ words: list.length ? list : ['cat', 'dog', 'sun', 'hat', 'run', 'bug', 'pet', 'red'] });
    } catch (err) {
        console.error('Fun-activities spelling-words error:', err.message);
        return res.status(500).json({ words: ['cat', 'dog', 'sun', 'hat', 'run', 'bug', 'pet', 'red'] });
    }
});

app.post('/api/fun-activities/spelling-hint', async (req, res) => {
    try {
        const word = (req.body?.word || '').toLowerCase().trim();
        if (!word) return res.status(400).json({ error: 'Missing body: { word }', hint: '' });
        const systemPrompt = 'You are a spelling game hint helper. Give a ONE short sentence clue that describes the word so the child can guess it, but do NOT say the word itself. Use simple language. Do not use markdown.';
        const hint = await llmChat(systemPrompt, `Word to hint (do not say this word): ${word}. Give one sentence clue.`, 80);
        return res.json({ hint: hint.trim() });
    } catch (err) {
        console.error('Fun-activities spelling-hint error:', err.message);
        return res.status(500).json({ error: err.message || 'Failed to get hint', hint: '' });
    }
});

app.post('/api/fun-activities/story-generate', async (req, res) => {
    try {
        const { setting, character, goal } = req.body || {};
        if (!setting || !character || !goal) {
            return res.status(400).json({ error: 'Missing body: { setting, character, goal }', story: '' });
        }
        const systemPrompt = 'You are a children\'s story writer. Write a short story (3 to 5 sentences) that includes the given setting, character, and goal. Use simple words and a clear beginning, middle, and end. Output only the story, no title or extra text. Do not use markdown.';
        const userMessage = `Setting: ${setting}. Character: ${character}. Goal: ${goal}.`;
        const story = await llmChat(systemPrompt, userMessage, 300);
        return res.json({ story: story.trim() });
    } catch (err) {
        console.error('Fun-activities story-generate error:', err.message);
        return res.status(500).json({ error: err.message || 'Failed to generate story', story: '' });
    }
});

app.post('/api/fun-activities/story-passage', async (req, res) => {
    try {
        const topic = (req.body?.topic || 'nature').toLowerCase();
        const level = (req.body?.level || 'easy').toLowerCase();
        const systemPrompt = `You are a children's reading passage writer. Write ONE short paragraph (3 to 5 simple sentences) for kids to read. Topic: ${topic}. Level: ${level}. Reply with a JSON object only: {"title":"Short title","text":"The paragraph text."}. No other text.`;
        const raw = await llmChat(systemPrompt, `Generate one short passage. Topic: ${topic}, level: ${level}.`, 250);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch) : {};
        const title = parsed.title || 'New Story';
        const text = parsed.text || '';
        return res.json({ title, text });
    } catch (err) {
        console.error('Fun-activities story-passage error:', err.message);
        return res.status(500).json({ title: 'New Story', text: '', error: err.message });
    }
});

app.post('/api/fun-activities/story-explain', async (req, res) => {
    try {
        const { text, type } = req.body || {};
        const t = typeof text === 'string' ? text.trim() : '';
        if (!t) return res.status(400).json({ error: 'Missing body: { text }', explanation: '', question: '', suggestedAnswer: '' });
        const isQuestion = (type || 'explain').toLowerCase() === 'question';
        const systemPrompt = isQuestion
            ? 'You are a reading comprehension helper for children. Based on the given text, ask ONE simple question that a child can answer (e.g. "What did the bird do?"). Then give a short suggested answer. Reply in JSON only: {"question":"...","suggestedAnswer":"..."}. No other text.'
            : 'You are a reading helper for children. In 1 to 2 short sentences, explain the given text in simple language. Reply in JSON only: {"explanation":"..."}. No other text.';
        const raw = await llmChat(systemPrompt, `Text: ${t.slice(0, 500)}.`, 150);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch) : {};
        if (isQuestion) return res.json({ question: parsed.question || '', suggestedAnswer: parsed.suggestedAnswer || '' });
        return res.json({ explanation: parsed.explanation || '' });
    } catch (err) {
        console.error('Fun-activities story-explain error:', err.message);
        return res.status(500).json({ error: err.message || 'Failed', explanation: '', question: '', suggestedAnswer: '' });
    }
});

app.post('/api/fun-activities/memory-hint', async (req, res) => {
    try {
        const { emoji } = req.body || {};
        if (emoji === undefined || emoji === null) return res.status(400).json({ error: 'Missing body: { emoji }', hint: '' });
        const systemPrompt = 'You are a memory game hint helper for children. In ONE short sentence, describe this emoji so a child can guess it (e.g. "An animal that barks"). Do NOT say the word or the emoji name. Use simple language. No markdown.';
        const hint = await llmChat(systemPrompt, `Emoji to describe (do not name it): ${emoji}. One sentence hint.`, 60);
        return res.json({ hint: hint.trim() });
    } catch (err) {
        console.error('Fun-activities memory-hint error:', err.message);
        return res.status(500).json({ error: err.message || 'Failed to get hint', hint: '' });
    }
});

app.post('/api/fun-activities/writing-feedback', async (req, res) => {
    try {
        const { itemId, correct } = req.body || {};
        const id = typeof itemId === 'string' ? itemId.trim() : 'shape';
        const isCorrect = correct === true;
        const systemPrompt = 'You are a kind writing practice coach for children. The learner just practiced drawing: ' + id + '. They got it ' + (isCorrect ? 'correct' : 'incorrect') + '. Reply with ONE short, kind sentence: either one specific tip to improve (if incorrect) or praise (if correct). No markdown.';
        const feedback = await llmChat(systemPrompt, 'Give one sentence only.', 80);
        return res.json({ feedback: feedback.trim() });
    } catch (err) {
        console.error('Fun-activities writing-feedback error:', err.message);
        return res.status(500).json({ error: err.message || 'Failed', feedback: '' });
    }
});

// Serve static files ONLY after all API routes
// This ensures /api/* routes are never caught by static file serving
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
    console.log(`BrightWords API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`API routes registered before static files`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

