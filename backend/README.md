# CRM Backend (Node.js + Express + PostgreSQL)

API REST simples para um CRM de clientes. Pronta para rodar em container e ser publicada no **EasyPanel**.

## 📦 Stack

- Node.js 20 + Express 4 (ES Modules)
- PostgreSQL via `pg` (sem Supabase)
- Validação com `zod`
- Segurança: `helmet`, `express-rate-limit`, CORS configurável e API key obrigatória
- Migrations automáticas no boot (cria a tabela `clients` se não existir)

## 🚀 Endpoints

Todas as rotas (exceto `/health`) exigem o header `x-api-key`.

| Método | Rota            | Descrição           |
| ------ | --------------- | ------------------- |
| GET    | `/health`       | Healthcheck público |
| GET    | `/clients`      | Lista clientes      |
| GET    | `/clients/:id`  | Obtém um cliente    |
| POST   | `/clients`      | Cria um cliente     |
| PUT    | `/clients/:id`  | Atualiza um cliente |
| DELETE | `/clients/:id`  | Remove um cliente   |

### Payload de criação/edição

```json
{
  "name": "Maria Silva",
  "company": "ACME Ltda",
  "birth_date": "1990-05-12",
  "notes": "Cliente VIP"
}
```

## 🔧 Variáveis de ambiente

Veja `.env.example`. As essenciais:

| Nome           | Descrição                                                            |
| -------------- | -------------------------------------------------------------------- |
| `DATABASE_URL` | String de conexão Postgres. No EasyPanel aponte para o serviço Postgres interno. |
| `PORT`         | Porta da API (default `3001`).                                       |
| `API_KEY`      | Chave secreta exigida no header `x-api-key` (mín. 16 caracteres).     |
| `CORS_ORIGIN`  | Origens permitidas, separadas por vírgula. Ex.: `https://meucrm.com`. |
| `NODE_ENV`     | `production` em produção.                                            |

## 🐳 Deploy no EasyPanel (Postgres separado)

1. **Crie um serviço Postgres** no EasyPanel (template oficial). Anote `host`, `usuário`, `senha` e `database`.
2. **Crie um App** apontando para este repositório/diretório `backend/`.
   - Tipo: **Dockerfile**
   - Porta interna: `3001`
3. **Defina as variáveis de ambiente** do app:
   - `DATABASE_URL=postgres://USER:PASS@NOME-DO-SERVICO-POSTGRES:5432/DB`
   - `API_KEY=<gere uma string aleatória com pelo menos 32 caracteres>`
   - `CORS_ORIGIN=https://seu-frontend.com`
   - `NODE_ENV=production`
4. **Deploy**. As migrations rodam automaticamente no startup.
5. Teste:
   ```bash
   curl https://api.seudominio.com/health
   curl -H "x-api-key: SUA_CHAVE" https://api.seudominio.com/clients
   ```

## 🧪 Rodando localmente

```bash
cp .env.example .env
# edite DATABASE_URL e API_KEY
npm install
npm run dev
```
