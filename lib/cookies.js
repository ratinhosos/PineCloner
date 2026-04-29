// Mini parser de cookies (sem dependências externas)
function parseCookies(req, res, next) {
    const header = req.headers.cookie || '';
    req.cookies = Object.fromEntries(
        header.split(';').map(c => c.trim()).filter(Boolean).map(c => {
            const idx = c.indexOf('=');
            return idx === -1 ? [c, ''] : [c.slice(0, idx), decodeURIComponent(c.slice(idx + 1))];
        })
    );
    next();
}

module.exports = { parseCookies };
