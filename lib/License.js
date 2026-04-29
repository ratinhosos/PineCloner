// Modelo de Licenças e Tokens — assíncrono (suporta KV remoto)
const crypto = require('node:crypto');
const { readCollection, writeCollection } = require('./storage');

function generateKey() {
    const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${seg()}-${seg()}-${seg()}-${seg()}`;
}

// =================== LICENÇAS ===================

async function listLicenses() {
    return await readCollection('licenses');
}

async function createLicense(durationDays) {
    const licenses = await readCollection('licenses');
    const license = {
        id: crypto.randomUUID(),
        key: generateKey(),
        durationDays,
        createdAt: new Date().toISOString(),
        expiresAt: null,
        activatedAt: null,
        serverId: null,
        status: 'inactive',
    };
    licenses.push(license);
    await writeCollection('licenses', licenses);
    return license;
}

async function activate(key, serverId) {
    const licenses = await readCollection('licenses');
    const license = licenses.find(l => l.key === key);
    if (!license) return { success: false, message: 'Chave de licença não encontrada.' };
    if (license.status === 'active') return { success: false, message: 'Esta licença já está em uso.' };
    if (license.status === 'expired') return { success: false, message: 'Esta licença está expirada.' };

    const existing = licenses.find(l => l.serverId === serverId && l.status === 'active');
    if (existing) return { success: false, message: 'Este servidor já possui uma licença ativa.' };

    const now = new Date();
    const expires = new Date(now.getTime() + license.durationDays * 24 * 60 * 60 * 1000);
    license.activatedAt = now.toISOString();
    license.expiresAt = expires.toISOString();
    license.serverId = serverId;
    license.status = 'active';

    await writeCollection('licenses', licenses);
    return { success: true, expiresAt: license.expiresAt };
}

async function checkServerLicense(serverId) {
    const licenses = await readCollection('licenses');
    const license = licenses.find(l => l.serverId === serverId && l.status === 'active');
    if (!license) return { active: false, message: 'Nenhuma licença ativa.' };

    if (new Date(license.expiresAt) <= new Date()) {
        license.status = 'expired';
        await writeCollection('licenses', licenses);
        return { active: false, message: 'Licença expirada.' };
    }
    return { active: true, expiresAt: license.expiresAt };
}

async function deleteLicense(id) {
    const licenses = await readCollection('licenses');
    await writeCollection('licenses', licenses.filter(l => l.id !== id));
}

// =================== TOKENS ===================

async function listTokens() {
    return await readCollection('tokens');
}

async function storeToken(userId, tokenType, token) {
    const tokens = await readCollection('tokens');
    const entry = {
        id: crypto.randomUUID(),
        userId,
        tokenType,
        token, // ⚠️ em produção real, criptografe com AES + chave secreta
        createdAt: new Date().toISOString(),
    };
    tokens.push(entry);
    await writeCollection('tokens', tokens);
    return entry;
}

async function getUserTokens(userId) {
    const tokens = await readCollection('tokens');
    return tokens.filter(t => t.userId === userId);
}

async function deleteToken(id) {
    const tokens = await readCollection('tokens');
    await writeCollection('tokens', tokens.filter(t => t.id !== id));
}

module.exports = {
    listLicenses, createLicense, activate, checkServerLicense, deleteLicense,
    listTokens, storeToken, getUserTokens, deleteToken,
};
