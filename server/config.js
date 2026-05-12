const fs = require('fs');
const path = require('path');

// Try to load a .env file from cwd at runtime (allows overriding without recompiling)
try {
  const envPath = path.join(process.cwd(), '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {}

// Hardcoded fallback values — baked into the binary at compile time
process.env.EMAIL_USER = process.env.EMAIL_USER || 'svaalentina123@gmail.com';
process.env.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'jeqfxbwqvfnwzqqs';
process.env.EMAIL_RECIPIENT = process.env.EMAIL_RECIPIENT || 'svaalentina123@gmail.com';
process.env.PORT = process.env.PORT || '3001';
