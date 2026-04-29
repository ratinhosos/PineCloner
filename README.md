# 🔑 License Panel — Painel de Licenças (Vercel Ready)

Painel administrativo + API REST para gerenciamento de **licenças** e **tokens** do Bot Cloner.
**Pronto para deploy direto na Vercel** com armazenamento persistente via [Vercel KV](https://vercel.com/storage/kv).

## ✨ Funcionalidades

- 🔑 Gerar licenças (1, 7 ou 30 dias) — chaves alfanuméricas únicas
- 📜 Listar / excluir licenças (com badges de status: ativa, inativa, expirada)
- 🔐 Visualizar tokens armazenados (mascarados) e excluí-los
- 🤖 API REST autenticada via `x-api-key` para o bot consumir
- 🔒 Login admin protegido por sessão (cookie HMAC assinado)

## 📁 Estrutura

```
license-panel-vercel/
├── api/
│   └── index.js          # Express app — entry point Vercel
├── lib/
│   ├── License.js        # Modelo de licenças/tokens
│   ├── storage.js        # Storage adapter (KV / arquivo / memória)
│   ├── auth.js           # Autenticação por sessão e API key
│   └── cookies.js        # Parser de cookies
├── views/
│   ├── login.ejs
│   └── admin.ejs
├── public/css/style.css
├── data/                 # Apenas para dev local
├── local.js              # Para rodar localmente
├── vercel.json           # Configuração Vercel
└── package.json
```

## 🚀 Deploy na Vercel (passo a passo)

### 1️⃣ Subir para o GitHub

```bash
cd license-panel-vercel
git init
git add .
git commit -m "feat: painel inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/license-panel-vercel.git
git push -u origin main
```

### 2️⃣ Importar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) → importe o repositório
2. **Framework Preset:** `Other`
3. **Root Directory:** `./` (raiz)
4. Clique em **Deploy**

### 3️⃣ Configurar Variáveis de Ambiente

No painel da Vercel → **Settings → Environment Variables**, adicione:

| Variável            | Exemplo                                  | Descrição |
|---------------------|------------------------------------------|-----------|
| `ADMIN_USERNAME`    | `admin`                                  | Login do painel |
| `ADMIN_PASSWORD`    | `senhaSuperSecreta123`                   | Senha do painel |
| `LICENSE_API_KEY`   | `chave-secreta-aleatoria-32-chars`       | Chave que o bot usará |
| `SESSION_SECRET`    | `outra-chave-aleatoria-diferente`        | Para assinar cookies |

### 4️⃣ (RECOMENDADO) Adicionar Vercel KV para persistência

Sem KV, os dados são salvos em memória e **se perdem** entre invocações serverless.

1. No projeto da Vercel: **Storage → Create Database → KV**
2. Conecte ao projeto
3. As variáveis `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` etc. são adicionadas automaticamente
4. Faça **Redeploy** do projeto

✅ Pronto! Os dados agora persistem permanentemente.

### 5️⃣ Configurar o Bot

No `.env` do bot, aponte para a URL gerada:

```env
LICENSE_API_URL=https://seu-projeto.vercel.app/api
LICENSE_API_KEY=chave-secreta-aleatoria-32-chars
```

## 💻 Rodando Localmente

```bash
npm install
cp .env.example .env
# preencha as variáveis
npm run dev
```

Abre em `http://localhost:3000`. Sem KV, usa arquivos JSON na pasta `data/`.

## 🔌 Endpoints da API

Todos exigem o header `x-api-key: <LICENSE_API_KEY>`.

| Método | Endpoint                          | Body / Params                            |
|--------|-----------------------------------|------------------------------------------|
| `POST` | `/api/activate-license`           | `{ key, serverId }`                      |
| `GET`  | `/api/check-license/:serverId`    | —                                        |
| `POST` | `/api/store-token`                | `{ userId, tokenType, token }`           |
| `GET`  | `/api/get-user-tokens/:userId`    | —                                        |
| `GET`  | `/api/health`                     | (público)                                |

### Exemplo de teste com curl

```bash
curl -X POST https://seu-projeto.vercel.app/api/activate-license \
     -H "x-api-key: SUA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"key":"AABB-CCDD-EEFF-1122","serverId":"123456789012345678"}'
```

## 🧠 Modos de Storage (automático)

O `lib/storage.js` detecta o ambiente automaticamente:

| Ambiente            | Modo                       | Persistência |
|---------------------|----------------------------|--------------|
| Dev local           | Arquivos JSON em `data/`   | ✅ Sim       |
| Vercel **com** KV   | Vercel KV (Redis)          | ✅ Sim       |
| Vercel **sem** KV   | Memória (efêmero)          | ❌ Não       |

## 🔒 Segurança

- ✅ API protegida por chave secreta (`x-api-key`)
- ✅ Painel protegido por cookie de sessão assinado com HMAC-SHA256
- ✅ Cookies `HttpOnly`, `Secure` (em produção), `SameSite=Lax`
- ⚠️ Use **senhas fortes** para `ADMIN_PASSWORD` e `LICENSE_API_KEY`
- ⚠️ Para tokens em produção real, **criptografe** com AES antes de armazenar

## 📝 Licença

MIT
