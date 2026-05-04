-- ============================================================
-- Migration 002: Tabela configuracoes
-- ============================================================

CREATE TABLE IF NOT EXISTS configuracoes (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Desabilitar RLS para acesso via service role do admin
-- (já protegido pela autenticação na camada de aplicação)
-- ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Valores padrão
INSERT INTO configuracoes (key, value) VALUES
  ('store_name',          'Gelo & Fogo Tabacaria'),
  ('store_email',         'contato@geloefogo.com.br'),
  ('free_shipping_above', '300'),
  ('default_weight_g',    '500'),
  ('pix_discount_pct',    '5'),
  ('max_installments',    '12'),
  ('whatsapp_number',     ''),
  ('store_active',        'true')
ON CONFLICT (key) DO NOTHING;

-- ── Policy admin para products (escrita por admins) ──────────────────────────
-- Adiciona política de escrita para usuários admin nos produtos
-- (necessário para criar/editar produtos via painel)

-- Remove política existente se houver conflito
DROP POLICY IF EXISTS "admin write products" ON products;

CREATE POLICY "admin write products" ON products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'super_admin', 'support')
    )
  );

-- ── Policy admin para suppliers ──────────────────────────────────────────────
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all suppliers" ON suppliers;
CREATE POLICY "admin all suppliers" ON suppliers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'super_admin', 'support')
    )
  );

-- ── Policy admin para supplier_sync_logs ────────────────────────────────────
ALTER TABLE supplier_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all sync_logs" ON supplier_sync_logs;
CREATE POLICY "admin all sync_logs" ON supplier_sync_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'super_admin', 'support')
    )
  );

-- ── Policy admin para coupons ────────────────────────────────────────────────
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all coupons" ON coupons;
CREATE POLICY "admin all coupons" ON coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'super_admin', 'support')
    )
  );

-- ── Policy admin para payments ───────────────────────────────────────────────
DROP POLICY IF EXISTS "admin all payments" ON payments;
CREATE POLICY "admin all payments" ON payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'super_admin', 'support')
    )
  );

-- ── Policy admin para orders ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin all orders" ON orders;
CREATE POLICY "admin all orders" ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'super_admin', 'support')
    )
  );

-- ── Policy admin para profiles ───────────────────────────────────────────────
DROP POLICY IF EXISTS "admin all profiles" ON profiles;
CREATE POLICY "admin all profiles" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role IN ('manager', 'super_admin', 'support')
    )
  );

-- ── Função helper: promover usuário para admin ───────────────────────────────
-- Use no SQL Editor do Supabase:
-- SELECT promote_to_admin('email@usuario.com');
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID AS $$
  UPDATE profiles
  SET role = 'super_admin'
  WHERE id = (SELECT id FROM auth.users WHERE email = user_email);
$$ LANGUAGE sql SECURITY DEFINER;
