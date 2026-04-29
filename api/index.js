// Entry point para Vercel Serverless — exporta um Express app
const express = require('express');
const bodyParser = require('body-parser');
const path = require('node:path');

const License = require('../lib/License');
const { parseCookies } = require('../lib/cookies');
const {
    createSessionCookie,
    apiAuth,
    adminAuth,
} = require('../lib/auth');

const app = express();

// Views (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(parseCookies);

// =================== ROTAS PÚBLICAS (PAINEL) ===================

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    ) {
        const secret = process.env.SESSION_SECRET || 'change-me';
        const cookie = createSessionCookie(secret);
        res.setHeader(
            'Set-Cookie',
            `session=${cookie}; HttpOnly; Path=/; Max-Age=${60 * 60 * 4}; SameSite=Lax${process.env.VERCEL ? '; Secure' : ''}`
        );
        return res.redirect('/admin');
    }
    res.render('login', { error: 'Credenciais inválidas.' });
});

app.get('/logout', (req, res) => {
    res.setHeader('Set-Cookie', 'session=; Path=/; Max-Age=0');
    res.redirect('/login');
});

// =================== PAINEL ADMIN ===================

app.get('/admin', adminAuth, async (req, res) => {
    const licenses = await License.listLicenses();
    const tokens = (await License.listTokens()).map(t => ({
        ...t,
        token: t.token.substring(0, 6) + '...' + t.token.slice(-4),
    }));
    res.render('admin', { licenses, tokens });
});

app.post('/admin/licenses/create', adminAuth, async (req, res) => {
    const days = parseInt(req.body.duration, 10);
    if ([1, 7, 30].includes(days)) await License.createLicense(days);
    res.redirect('/admin');
});

app.post('/admin/licenses/delete/:id', adminAuth, async (req, res) => {
    await License.deleteLicense(req.params.id);
    res.redirect('/admin');
});

app.post('/admin/tokens/delete/:id', adminAuth, async (req, res) => {
    await License.deleteToken(req.params.id);
    res.redirect('/admin');
});

// =================== API REST (consumida pelo Bot) ===================

app.post('/api/activate-license', apiAuth, async (req, res) => {
    const { key, serverId } = req.body;
    if (!key || !serverId) return res.status(400).json({ message: 'Parâmetros ausentes.' });
    const result = await License.activate(key, serverId);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
});

app.get('/api/check-license/:serverId', apiAuth, async (req, res) => {
    const result = await License.checkServerLicense(req.params.serverId);
    res.json(result);
});

app.post('/api/store-token', apiAuth, async (req, res) => {
    const { userId, tokenType, token } = req.body;
    if (!userId || !tokenType || !token) {
        return res.status(400).json({ message: 'Parâmetros ausentes.' });
    }
    await License.storeToken(userId, tokenType, token);
    res.json({ success: true, message: 'Token armazenado com sucesso.' });
});

app.get('/api/get-user-tokens/:userId', apiAuth, async (req, res) => {
    const tokens = await License.getUserTokens(req.params.userId);
    res.json({ tokens });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ ok: true, version: '1.0.0', vercel: !!process.env.VERCEL });
});

// 404
app.use((req, res) => res.status(404).send('Página não encontrada'));

module.exports = app;
