# 🔥 Gelo & Fogo — Guia de Setup Completo

## 1. Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)
- (Opcional) Stripe, Mercado Pago, Resend

---

## 2. Supabase — Banco de dados

1. Crie um projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor** e execute os arquivos de migration em ordem:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_configuracoes_and_policies.sql
   ```

3. Para promover seu usuário a admin (após criar a conta):
   ```sql
   SELECT promote_to_admin('seu@email.com');
   ```

---

## 3. Variáveis de Ambiente

Copie `.env.example` para `.env.local`:
```bash
cp env.example .env.local
```

Preencha no mínimo:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 4. Instalar e rodar

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

---

## 5. Criar primeiro admin

1. Acesse `/entrar` e crie uma conta
2. No Supabase SQL Editor, execute:
   ```sql
   SELECT promote_to_admin('seu@email.com');
   ```
3. Acesse `/admin` — você terá acesso completo

---

## 6. Estrutura do Painel Admin

| Rota | Função |
|------|--------|
| `/admin` | Dashboard com KPIs |
| `/admin/pedidos` | Kanban de pedidos com drag & drop |
| `/admin/produtos` | Lista, criar, editar, importar CSV |
| `/admin/fornecedores` | Cadastrar fornecedores com integração automática |
| `/admin/clientes` | Base de clientes |
| `/admin/marketing` | Cupons de desconto |
| `/admin/financeiro` | Conciliação de pagamentos |
| `/admin/configuracoes` | Ajustes gerais da loja |

---

## 7. Adicionar Produtos de Fornecedores

### Via painel (manual):
1. `/admin/fornecedores/novo` → tipo "Manual"
2. `/admin/produtos/novo` → selecionar fornecedor

### Via CSV:
1. `/admin/produtos/importar` → baixar template
2. Preencher e fazer upload

### Via API (automático):
1. `/admin/fornecedores/novo` → tipo "REST API"
2. Preencher URL e credenciais
3. Clicar "Sync" no painel

---

## 8. Deploy (Vercel)

```bash
vercel --prod
```

Configure as mesmas variáveis de ambiente no Vercel Dashboard.
