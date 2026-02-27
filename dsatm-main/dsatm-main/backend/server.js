const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Configure CORS to allow requests from localhost:8000
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:9000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// IMPORTANT: API routes must be registered BEFORE static files
// This ensures /api/* routes never fall through to static file serving

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY_ID',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_RAZORPAY_KEY_SECRET'
});

// Log Razorpay initialization status
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    console.log('✅ Razorpay initialized with Key ID:', process.env.RAZORPAY_KEY_ID.substring(0, 15) + '...');
} else {
    console.warn('⚠️ Warning: Razorpay keys not found in environment variables!');
}

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'subscriptions.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        // Create tables if they don't exist
        db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            unified_user_id TEXT,
            user_name TEXT,
            plan_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            amount INTEGER NOT NULL,
            currency TEXT DEFAULT 'INR',
            razorpay_order_id TEXT,
            razorpay_payment_id TEXT,
            razorpay_signature TEXT,
            start_date TEXT,
            end_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating subscriptions table:', err.message);
            } else {
                console.log('Subscriptions table ready');
                // Add unified_user_id column if it doesn't exist (for existing databases)
                db.run(`ALTER TABLE subscriptions ADD COLUMN unified_user_id TEXT`, () => {
                    // Ignore error if column already exists
                });
            }
        });

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

// Plan configurations (amounts in paise)
const PLANS = {
    monthly: {
        name: 'Monthly Plan',
        amount: 9900, // ₹99
        duration: 'monthly',
        days: 30
    },
    yearly: {
        name: 'Yearly Plan',
        amount: 118800, // ₹1,188 (₹99 × 12)
        duration: 'yearly',
        days: 365
    },
    team_monthly: {
        name: 'Team Monthly Plan',
        amount: 150000, // ₹1,500
        duration: 'monthly',
        days: 30
    },
    team_yearly: {
        name: 'Team Yearly Plan',
        amount: 1800000, // ₹18,000 (₹1,500 × 12)
        duration: 'yearly',
        days: 365
    }
};

// Allow legacy/alias plan keys to map to the current plan keys
const PLAN_ALIASES = {
    individualMonthly: 'monthly',
    individualYearly: 'yearly',
    teamMonthly: 'team_monthly',
    teamYearly: 'team_yearly'
};

// Helper function to calculate end date
function calculateEndDate(startDate, planType) {
    const start = new Date(startDate);
    const plan = PLANS[planType];
    if (!plan) return null;
    
    start.setDate(start.getDate() + plan.days);
    return start.toISOString();
}

// Helper function to generate receipt ID (max 40 characters for Razorpay)
function generateReceiptId(userEmail, planType) {
    if (!userEmail || !planType) {
        // Fallback if userEmail or planType is missing
        const fallback = `RCP_${Date.now().toString(36).slice(-12)}`;
        return fallback.length > 40 ? fallback.substring(0, 40) : fallback;
    }
    
    // Create a short hash from email (8 chars for more safety)
    const emailHash = crypto.createHash('md5').update(userEmail).digest('hex').substring(0, 8);
    const planCode = planType.substring(0, 3).toUpperCase(); // First 3 chars of plan type (MON or YEA)
    
    // Create a short timestamp (last 10 chars of base36 timestamp for uniqueness)
    const timestamp = Date.now().toString(36).slice(-10);
    
    // Format: RCP_<plan>_<hash><timestamp>
    // RCP_ (4) + MON (3) + _ (1) + hash (8) + timestamp (10) = 26 chars
    // This is well under 40 chars limit
    const receipt = `RCP_${planCode}_${emailHash}${timestamp}`;
    
    // Ensure it's exactly 40 characters or less (safety check)
    const finalReceipt = receipt.length > 40 ? receipt.substring(0, 40) : receipt;
    
    // Log for debugging
    console.log(`Generated receipt: ${finalReceipt} (length: ${finalReceipt.length})`);
    
    return finalReceipt;
}

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

// Create Razorpay order
app.post('/api/subscription/create-order', async (req, res) => {
    try {
    let { plan, amount, currency, userEmail, userName, unifiedUserId } = req.body;
    // Normalize plan using aliases if needed
    if (!PLANS[plan] && PLAN_ALIASES[plan]) {
        plan = PLAN_ALIASES[plan];
    }

        // Validate plan
        if (!PLANS[plan]) {
            return res.status(400).json({ error: 'Invalid plan type' });
        }

        // Validate amount matches plan
        if (amount !== PLANS[plan].amount) {
            return res.status(400).json({ error: 'Amount does not match plan' });
        }

        // If unifiedUserId is provided but no email, get email from users table
        let finalEmail = userEmail;
        if (unifiedUserId && !userEmail) {
            // Use a promise wrapper for the callback-based function
            finalEmail = await new Promise((resolve) => {
                getUserByIdentifier(unifiedUserId, null, (userErr, user) => {
                    if (!userErr && user) {
                        resolve(user.user_email || user.linked_google_email || `user_${unifiedUserId}@brightwords.local`);
                    } else {
                        resolve(`user_${unifiedUserId}@brightwords.local`);
                    }
                });
            });
        }

        // Create Razorpay order
        // Generate receipt ID (must be max 40 characters)
        const receiptId = generateReceiptId(finalEmail || unifiedUserId, plan);
        
        // Validate receipt length before creating order
        if (receiptId.length > 40) {
            console.error('❌ Receipt ID too long:', receiptId, 'Length:', receiptId.length);
            return res.status(500).json({ 
                error: 'Internal error: Receipt ID generation failed',
                details: `Receipt length ${receiptId.length} exceeds 40 characters`
            });
        }
        
        const options = {
            amount: amount,
            currency: currency || 'INR',
            receipt: receiptId,
            notes: {
                plan: plan,
                user_email: userEmail,
                user_name: userName
            }
        };

        console.log('Creating Razorpay order with options:', {
            amount: options.amount,
            currency: options.currency,
            receipt: options.receipt,
            receiptLength: options.receipt.length
        });

        const order = await razorpay.orders.create(options);
        console.log('✅ Razorpay order created successfully:', order.id);

        // Store order in database (status: pending)
        const startDate = new Date().toISOString();
        const endDate = calculateEndDate(startDate, plan);

        db.run(
            `INSERT INTO subscriptions (user_email, unified_user_id, user_name, plan_type, status, amount, currency, razorpay_order_id, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [finalEmail || `user_${unifiedUserId}@brightwords.local`, unifiedUserId || null, userName || '', plan, 'pending', amount, currency || 'INR', order.id, startDate, endDate],
            function(err) {
                if (err) {
                    console.error('Error storing order:', err.message);
                }
            }
        );

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            status: order.status
        });

    } catch (error) {
        console.error('❌ Error creating Razorpay order:', error);
        
        // Extract detailed error information
        let errorMessage = 'Failed to create order';
        let errorDetails = error.message;
        let errorCode = 500;
        
        if (error.error) {
            // Razorpay API error
            errorMessage = error.error.description || error.error.reason || error.error.message || errorMessage;
            errorDetails = JSON.stringify(error.error);
            errorCode = error.statusCode || 500;
            console.error('Razorpay API Error:', error.error);
        } else if (error.message) {
            errorMessage = error.message;
            console.error('Error message:', error.message);
        }
        
        // Check if it's an authentication error
        if (errorMessage.includes('authentication') || errorMessage.includes('key') || errorMessage.includes('unauthorized')) {
            errorMessage = 'Razorpay authentication failed. Please check your API keys in the .env file.';
        }
        
        res.status(errorCode).json({ 
            error: errorMessage,
            details: errorDetails,
            code: errorCode
        });
    }
});

// Verify payment and activate subscription
app.post('/api/subscription/verify-payment', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, userEmail, unifiedUserId } = req.body;

        // Verify the payment signature
        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!razorpaySecret) {
            return res.status(500).json({ error: 'Razorpay secret key not configured' });
        }
        
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generated_signature = crypto
            .createHmac('sha256', razorpaySecret)
            .update(text)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // Update subscription in database
        const startDate = new Date().toISOString();
        const endDate = calculateEndDate(startDate, plan);

        // Build WHERE clause to support both email and unified_user_id
        const whereClause = unifiedUserId 
            ? `razorpay_order_id = ? AND (user_email = ? OR unified_user_id = ?)`
            : `razorpay_order_id = ? AND user_email = ?`;
        const whereParams = unifiedUserId 
            ? [razorpay_order_id, userEmail, unifiedUserId]
            : [razorpay_order_id, userEmail];
        
        db.run(
            `UPDATE subscriptions 
             SET status = 'active', 
                 razorpay_payment_id = ?, 
                 razorpay_signature = ?,
                 start_date = ?,
                 end_date = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE ${whereClause}`,
            [razorpay_payment_id, razorpay_signature, startDate, endDate, ...whereParams],
            function(err) {
                if (err) {
                    console.error('Error updating subscription:', err.message);
                    return res.status(500).json({ error: 'Failed to activate subscription' });
                }

                // Get the updated subscription
                const selectWhereClause = unifiedUserId 
                    ? `razorpay_order_id = ? AND (user_email = ? OR unified_user_id = ?)`
                    : `razorpay_order_id = ? AND user_email = ?`;
                db.get(
                    `SELECT * FROM subscriptions WHERE ${selectWhereClause}`,
                    whereParams,
                    (err, row) => {
                        if (err) {
                            console.error('Error fetching subscription:', err.message);
                            return res.status(500).json({ error: 'Failed to fetch subscription' });
                        }

                        res.json({
                            success: true,
                            message: 'Payment verified and subscription activated',
                            subscription: {
                                plan: row.plan_type,
                                status: row.status,
                                startDate: row.start_date,
                                endDate: row.end_date,
                                paymentId: row.razorpay_payment_id
                            }
                        });
                    }
                );
            }
        );

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Failed to verify payment', details: error.message });
    }
});

// Check subscription status (supports unified_user_id)
app.get('/api/subscription/status', (req, res) => {
    try {
        const { userEmail, unifiedUserId } = req.query;

        if (!userEmail && !unifiedUserId) {
            return res.status(400).json({ error: 'User email or unifiedUserId is required' });
        }

        // Build WHERE clause to support both email and unified_user_id
        const whereClause = unifiedUserId 
            ? `(user_email = ? OR unified_user_id = ?) AND status = 'active'`
            : `user_email = ? AND status = 'active'`;
        const whereParams = unifiedUserId 
            ? [userEmail || '', unifiedUserId]
            : [userEmail];

        // Get the most recent active subscription
        db.get(
            `SELECT * FROM subscriptions 
             WHERE ${whereClause}
             ORDER BY created_at DESC 
             LIMIT 1`,
            whereParams,
            (err, row) => {
                if (err) {
                    console.error('Error fetching subscription:', err.message);
                    return res.status(500).json({ error: 'Failed to check subscription' });
                }

                if (!row) {
                    return res.json({
                        hasSubscription: false,
                        subscription: null
                    });
                }

                // Check if subscription is still valid
                const endDate = new Date(row.end_date);
                const now = new Date();

                if (endDate <= now) {
                    // Subscription expired - update status
                    db.run(
                        `UPDATE subscriptions SET status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                        [row.id]
                    );

                    return res.json({
                        hasSubscription: false,
                        subscription: null
                    });
                }

                res.json({
                    hasSubscription: true,
                    subscription: {
                        plan: row.plan_type,
                        status: row.status,
                        startDate: row.start_date,
                        endDate: row.end_date
                    }
                });
            }
        );

    } catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({ error: 'Failed to check subscription status' });
    }
});

// Get user's subscription history (supports unified_user_id)
app.get('/api/subscription/history', (req, res) => {
    try {
        const { userEmail, unifiedUserId } = req.query;

        if (!userEmail && !unifiedUserId) {
            return res.status(400).json({ error: 'User email or unifiedUserId is required' });
        }

        // Build WHERE clause to support both email and unified_user_id
        const whereClause = unifiedUserId 
            ? `(user_email = ? OR unified_user_id = ?)`
            : `user_email = ?`;
        const whereParams = unifiedUserId 
            ? [userEmail || '', unifiedUserId]
            : [userEmail];

        db.all(
            `SELECT * FROM subscriptions 
             WHERE ${whereClause}
             ORDER BY created_at DESC`,
            whereParams,
            (err, rows) => {
                if (err) {
                    console.error('Error fetching subscription history:', err.message);
                    return res.status(500).json({ error: 'Failed to fetch subscription history' });
                }

                res.json({
                    subscriptions: rows.map(row => ({
                        id: row.id,
                        plan: row.plan_type,
                        status: row.status,
                        amount: row.amount,
                        currency: row.currency,
                        startDate: row.start_date,
                        endDate: row.end_date,
                        paymentId: row.razorpay_payment_id,
                        createdAt: row.created_at
                    }))
                });
            }
        );

    } catch (error) {
        console.error('Error fetching subscription history:', error);
        res.status(500).json({ error: 'Failed to fetch subscription history' });
    }
});

// Serve static files ONLY after all API routes
// This ensures /api/* routes are never caught by static file serving
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
    console.log(`BrightWords Subscription API server running on port ${PORT}`);
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

