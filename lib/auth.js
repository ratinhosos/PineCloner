// Autenticação simples baseada em cookie assinado (compatível com Vercel serverless)
const crypto = require('node:crypto');

function sign(value, secret) {
    return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function createSessionCookie(secret) {
    const value = 'admin';
    const sig = sign(value, secret);
    return `${value}.${sig}`;
}

function verifySessionCookie(cookieValue, secret) {
    if (!cookieValue) return false;
    const [value, sig] = cookieValue.split('.');
    if (!value || !sig) return false;
    const expected = sign(value, secret);
    try {
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) && value === 'admin';
    } catch {
        return false;
    }
}

// Middleware de autenticação por API Key (para o bot)
function apiAuth(req, res, next) {
    const key = req.headers['x-api-key'];
    if (!key || key !== process.env.LICENSE_API_KEY) {
        return res.status(401).json({ error: 'API key inválida' });
    }
    next();
}

// Middleware de autenticação por sessão (painel admin)
function adminAuth(req, res, next) {
    const secret = process.env.SESSION_SECRET || 'change-me';
    const cookie = req.cookies?.session;
    if (verifySessionCookie(cookie, secret)) return next();
    return res.redirect('/login');
}

module.exports = { createSessionCookie, verifySessionCookie, apiAuth, adminAuth };
