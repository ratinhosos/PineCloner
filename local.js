// Servidor local para desenvolvimento (fora da Vercel)
require('dotenv').config();
const app = require('./api/index');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Painel rodando em http://localhost:${PORT}`);
    console.log(`📋 Login: ${process.env.ADMIN_USERNAME || '(defina ADMIN_USERNAME)'}`);
});
