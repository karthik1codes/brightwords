const { Redis } = require('@upstash/redis');

const memoryStore = new Map();
let redis;

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured in production.');
    }
    return null;
  }
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

function emptyProgress() {
  return {
    activity_events: 0,
    completed_activities: 0,
    practice_minutes: 0,
    active_days: [],
    activity_breakdown: {},
    updated_at: new Date().toISOString(),
  };
}

function progressKey(user) {
  return `brightwords:progress:${user.sub}`;
}

async function read(user) {
  const key = progressKey(user);
  const client = getRedis();
  const saved = client ? await client.get(key) : memoryStore.get(key);
  return { ...emptyProgress(), ...(saved || {}) };
}

async function write(user, progress) {
  const key = progressKey(user);
  const client = getRedis();
  if (client) {
    await client.set(key, progress);
  } else {
    memoryStore.set(key, progress);
  }
}

function sanitizeEvent(event = {}) {
  const activity = typeof event.activity === 'string' ? event.activity.trim().slice(0, 64) : '';
  const action = typeof event.action === 'string' ? event.action.trim().slice(0, 64) : '';
  const durationSeconds = Number(event.durationSeconds);
  if (!activity || !action) throw new Error('Activity and action are required.');
  return {
    activity,
    action,
    completed: event.completed === true,
    durationSeconds: Number.isFinite(durationSeconds) ? Math.max(0, Math.min(durationSeconds, 60 * 60)) : 0,
  };
}

async function record(user, rawEvent) {
  const event = sanitizeEvent(rawEvent);
  const progress = await read(user);
  const day = new Date().toISOString().slice(0, 10);
  const activity = progress.activity_breakdown[event.activity] || { opened: 0, completed: 0 };

  progress.activity_events += 1;
  if (event.action === 'opened') activity.opened += 1;
  if (event.completed) {
    progress.completed_activities += 1;
    activity.completed += 1;
  }
  progress.practice_minutes += Math.round(event.durationSeconds / 60);
  progress.activity_breakdown[event.activity] = activity;
  progress.active_days = Array.from(new Set([...progress.active_days, day])).slice(-90);
  progress.updated_at = new Date().toISOString();
  await write(user, progress);
  return progress;
}

module.exports = { read, record };
