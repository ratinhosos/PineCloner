/**
 * Storage adapter — Funciona em 3 modos:
 *  1) Vercel KV (produção, recomendado) — quando KV_REST_API_URL existe
 *  2) Arquivo JSON local (desenvolvimento) — fora do ambiente Vercel
 *  3) Memória (fallback Vercel sem KV) — atenção: dados são efêmeros
 *
 * Escolhe automaticamente o modo correto.
 */
const fs = require('node:fs');
const path = require('node:path');

const HAS_KV = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
const IS_VERCEL = !!process.env.VERCEL;

let kv = null;
if (HAS_KV) {
    try {
        kv = require('@vercel/kv').kv;
        console.log('💾 [STORAGE] Usando Vercel KV');
    } catch (e) {
        console.warn('⚠️ [STORAGE] @vercel/kv não disponível, usando fallback');
    }
}

// Memória (fallback para Vercel sem KV)
const memoryStore = { licenses: [], tokens: [] };

// Arquivo local (dev)
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!IS_VERCEL && !fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function localFile(name) { return path.join(DATA_DIR, `${name}.json`); }

async function readCollection(name) {
    if (kv) {
        const data = await kv.get(name);
        return data || [];
    }
    if (IS_VERCEL) {
        return memoryStore[name] || [];
    }
    // Local file
    const file = localFile(name);
    if (!fs.existsSync(file)) fs.writeFileSync(file, '[]', 'utf-8');
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
        return [];
    }
}

async function writeCollection(name, data) {
    if (kv) {
        await kv.set(name, data);
        return;
    }
    if (IS_VERCEL) {
        memoryStore[name] = data;
        return;
    }
    fs.writeFileSync(localFile(name), JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readCollection, writeCollection, HAS_KV, IS_VERCEL };
