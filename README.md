# 💍 Liandra & André — Site de Casamento

Site de casamento full-stack com lista de presentes paga via **Mercado Pago** (Pix nativo + Cartão), galeria de fotos colaborativa e painel administrativo para os noivos.

**Data do casamento:** 14 de Fevereiro de 2026

---

## ✨ Funcionalidades

### 🎁 Lista de presentes
- Catálogo de presentes com categorias (Lua de Mel, Casa, Eletrodomésticos, Experiências, Presentes divertidos)
- Pagamento via **Pix nativo** (QR Code + código copia-e-cola gerado direto na página, sem redirecionamento)
- Pagamento via **Cartão de crédito/débito** (Checkout Pro do Mercado Pago, com redirecionamento)
- Carrinho de compras com múltiplos presentes numa única cobrança
- Controle de disponibilidade em tempo real (presentes esgotados ficam bloqueados automaticamente)
- Suporte a presentes "repetíveis" (vaquinhas com limite de contribuições ou ilimitadas)
- Página de agradecimento com redirecionamento automático após o pagamento

### 📸 Galeria de fotos
- Upload de fotos pelos convidados via QR Code nas mesas do evento
- Compressão de imagem no navegador antes do envio (otimização de banda e armazenamento)
- Galeria separada para fotos dos noivos e dos convidados
- Página dedicada com abas: Pré-Wedding, Noivos e Convidados
- Visualizador de fotos em tela cheia (lightbox) com navegação entre imagens

### 🔐 Painel administrativo
- Login protegido por senha com autenticação via JWT
- Lista de presentes recebidos (quem deu, o quê, valor e mensagem)
- Moderação das fotos enviadas pelos convidados (exclusão)
- Upload de fotos como "noivos"

---

## 🛠️ Stack técnica

**Backend**
- Node.js + Express (ES Modules)
- [Supabase](https://supabase.com) (PostgreSQL + Storage)
- [Mercado Pago SDK](https://github.com/mercadopago/sdk-nodejs) (Checkout Pro + Pix nativo via API de Pagamentos)
- `multer` para upload de arquivos
- `jsonwebtoken` para autenticação do painel administrativo
- `nodemon` para desenvolvimento

**Frontend**
- HTML, CSS e JavaScript puro (sem framework)
- ES Modules no navegador
- Fontes: Cormorant Garamond, Great Vibes e Jost (Google Fonts)
- Font Awesome para ícones

---

## 📁 Estrutura do projeto

```
casamentoLiandra/
├── backEnd/
│   ├── src/
│   │   ├── config/          # Configuração de conexões (Supabase, Mercado Pago, Multer)
│   │   ├── controllers/     # Lógica das rotas
│   │   ├── services/        # Regras de negócio e integrações externas
│   │   ├── routes/          # Definição das rotas do Express
│   │   ├── middlewares/     # Autenticação do painel admin
│   │   ├── data/            # Catálogo de presentes (fonte da verdade de preços)
│   │   ├── app.js
│   │   └── server.js
│   ├── .env                 # Variáveis de ambiente (não versionado)
│   └── package.json
│
└── frontEnd/
    └── src/
        ├── screens/          # index.html, gifts.html, galeria.html, admin.html, obrigado.html
        ├── scripts/          # JS de cada página + utilitários compartilhados
        ├── css/              # Estilos
        └── img/              # Imagens dos presentes e do site
```

---

## ⚙️ Configuração do ambiente

### 1. Backend

```bash
cd backEnd
npm install
```

Crie um arquivo `.env` na raiz do `backEnd` com as seguintes variáveis:

```dotenv
# Mercado Pago
MP_ACCESS_TOKEN=seu_access_token_do_mercado_pago

# Supabase
SUPABASE_URL=https://seuprojeto.supabase.co
SUPABASE_KEY=sua_service_role_ou_secret_key

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5500

# Painel administrativo
ADMIN_PASSWORD=escolha_uma_senha_forte
JWT_SECRET=uma_string_aleatoria_longa_e_dificil_de_adivinhar
```

Inicie o servidor:

```bash
npm run dev
```

### 2. Banco de dados (Supabase)

Execute os scripts SQL abaixo no **SQL Editor** do seu projeto Supabase:

```sql
-- Pagamentos de presentes
create table gift_payments (
  id uuid primary key default gen_random_uuid(),
  gift_id text[] not null,
  amount numeric not null,
  status text default 'pending',
  guest_name text,
  guest_message text,
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamp default now()
);

-- Fotos da galeria
create table photos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  uploaded_by text not null,
  guest_name text,
  created_at timestamp default now()
);
```

Crie também um **bucket público** no Storage chamado `wedding-photos`.

### 3. Frontend

O frontend é HTML/CSS/JS estático — pode ser servido com a extensão **Live Server** do VS Code ou qualquer servidor estático de sua preferência.

⚠️ Lembre-se de ajustar a constante `API_URL` (presente em `gifts.js`, `gallery.js`, `admin.js` e `galeriasPage.js`) para apontar para o endereço correto do backend, conforme o ambiente:
- Desenvolvimento local: `http://localhost:3000`
- Teste em rede local (celular): `http://SEU_IP_LOCAL:3000`
- Produção: URL do backend hospedado

### 4. Testando webhooks localmente

Como o Mercado Pago precisa de uma URL pública para enviar notificações de pagamento, use o [ngrok](https://ngrok.com) durante o desenvolvimento:

```bash
ngrok http 3000
```

Atualize `BACKEND_URL` no `.env` com a URL gerada pelo ngrok.

---

## 🔑 Principais rotas da API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/pagamentos/criar-preferencia` | Cria preferência de pagamento (Cartão) |
| `POST` | `/pagamentos/criar-pix` | Gera pagamento Pix nativo com QR Code |
| `GET` | `/pagamentos/status/:id` | Consulta status de um pagamento (polling) |
| `POST` | `/pagamentos/webhook` | Recebe notificações do Mercado Pago |
| `GET` | `/gifts/disponibilidade` | Lista disponibilidade de todos os presentes |
| `POST` | `/fotos/upload` | Upload de foto por convidado |
| `GET` | `/fotos?tipo=` | Lista fotos (filtro opcional: `noivo`/`convidado`) |
| `POST` | `/admin/login` | Autenticação do painel administrativo |
| `GET` | `/admin/gifts` | Lista presentes recebidos *(protegida)* |
| `GET` | `/admin/photos` | Lista todas as fotos *(protegida)* |
| `DELETE` | `/admin/photos/:id` | Remove uma foto *(protegida)* |
| `POST` | `/admin/photos/upload` | Upload de foto como noivo *(protegida)* |

---

## 🚀 Checklist antes de publicar em produção

- [ ] Trocar credenciais de **teste** do Mercado Pago pelas de **produção**
- [ ] Atualizar todas as URLs fixas (`localhost`/IP local/ngrok) para os domínios reais
- [ ] Remover itens de teste do catálogo de presentes
- [ ] Trocar `ADMIN_PASSWORD` e `JWT_SECRET` por valores fortes e definitivos
- [ ] Validar a assinatura secreta do webhook do Mercado Pago (segurança extra)
- [ ] Escolher hospedagem para backend (Render, Railway, etc.) e frontend (Vercel, Netlify, etc.)
- [ ] Testar um pagamento real de ponta a ponta em produção
- [ ] Gerar os QR Codes finais (apontando para o domínio de produção) para as mesas do evento
