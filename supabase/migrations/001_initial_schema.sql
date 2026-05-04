-- ============================================================
-- Tabacaria Dropshipping — Schema Supabase PostgreSQL
-- Arquivo: supabase/migrations/001_initial_schema.sql
-- Como usar: cole no SQL Editor do Supabase ou rode via CLI:
--   supabase db push
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── Enums ────────────────────────────────────────────────────
CREATE TYPE order_status AS ENUM (
  'aguardando_pagamento','pago','processando',
  'enviado','entregue','devolvido','cancelado'
);
CREATE TYPE payment_method AS ENUM ('pix','boleto','cartao');
CREATE TYPE payment_status AS ENUM ('pendente','aprovado','falhou','estornado');
CREATE TYPE supplier_type  AS ENUM ('rest_api','csv_ftp','webhook','manual');
CREATE TYPE user_role      AS ENUM ('customer','support','manager','super_admin');
CREATE TYPE intensity_level AS ENUM ('suave','medio','forte','muito_forte');

-- ── Profiles (estende auth.users) ────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  cpf         TEXT UNIQUE,
  phone       TEXT,
  role        user_role NOT NULL DEFAULT 'customer',
  points      INT NOT NULL DEFAULT 0,
  tags        TEXT[],
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger: cria perfil automaticamente após signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Suppliers ────────────────────────────────────────────────
CREATE TABLE suppliers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  type        supplier_type NOT NULL,
  config      JSONB NOT NULL DEFAULT '{}',
  markup_pct  NUMERIC(5,2) NOT NULL DEFAULT 40,
  priority    INT NOT NULL DEFAULT 10,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE supplier_sync_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id  UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  started_at   TIMESTAMPTZ NOT NULL,
  finished_at  TIMESTAMPTZ,
  added        INT DEFAULT 0,
  updated      INT DEFAULT 0,
  removed      INT DEFAULT 0,
  errors       JSONB,
  status       TEXT  -- 'success' | 'partial' | 'failed'
);

-- ── Categories ───────────────────────────────────────────────
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  parent_id  UUID REFERENCES categories(id),
  sort_order INT DEFAULT 0
);

-- Categorias iniciais
INSERT INTO categories (slug, name, sort_order) VALUES
  ('charutos',      'Charutos',           1),
  ('cigarrilhas',   'Cigarrilhas',         2),
  ('cachimbos',     'Cachimbos',           3),
  ('narguiles',     'Narguilés',           4),
  ('acessorios',    'Acessórios',          5),
  ('isqueiros',     'Isqueiros',           6),
  ('cinzeiros',     'Cinzeiros',           7),
  ('kits-presente', 'Kits Presente',       8),
  ('sedas',         'Sedas',               9),
  ('dichavadores',  'Dichavadores',       10),
  ('cuias',         'Cuias',              11),
  ('tesourinhas',   'Tesourinhas',        12),
  ('piteiras',      'Piteiras',           13),
  ('tabaco-organico','Tabaco Orgânico',   14),
  ('lupulo',        'Lúpulo',             15),
  ('roupas',        'Roupas',             16);

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  sku             TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  category_id     UUID REFERENCES categories(id),
  supplier_id     UUID REFERENCES suppliers(id),
  supplier_sku    TEXT,
  cost_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  compare_price   NUMERIC(10,2),
  stock           INT NOT NULL DEFAULT 0,
  weight_g        INT,
  images          TEXT[],
  video_url       TEXT,
  intensity       intensity_level,
  origin_country  TEXT,
  brand           TEXT,
  tags            TEXT[],
  harmonization   JSONB,
  attributes      JSONB,
  search_vector   TSVECTOR,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX products_search_idx ON products USING GIN(search_vector);
CREATE INDEX products_tags_idx   ON products USING GIN(tags);
CREATE INDEX products_active_idx ON products(active, deleted_at);

-- Trigger: atualiza search_vector
CREATE OR REPLACE FUNCTION update_product_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('portuguese',
      coalesce(NEW.name,'') || ' ' ||
      coalesce(NEW.brand,'') || ' ' ||
      coalesce(NEW.description,'')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_update
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search();

-- RLS produtos (leitura pública para ativos)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active products" ON products
  FOR SELECT USING (active = TRUE AND deleted_at IS NULL);

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES profiles(id),
  status            order_status NOT NULL DEFAULT 'aguardando_pagamento',
  subtotal          NUMERIC(10,2) NOT NULL,
  shipping_cost     NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  total             NUMERIC(10,2) NOT NULL,
  shipping_address  JSONB NOT NULL,
  coupon_code       TEXT,
  notes             TEXT,
  supplier_order_id TEXT,
  tracking_code     TEXT,
  tracking_events   JSONB,
  points_earned     INT DEFAULT 0,
  points_redeemed   INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders" ON orders
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  sku         TEXT NOT NULL,
  name        TEXT NOT NULL,
  quantity    INT NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL,
  cost_price  NUMERIC(10,2) NOT NULL DEFAULT 0
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
  );

-- ── Payments ─────────────────────────────────────────────────
CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID REFERENCES orders(id),
  method            payment_method NOT NULL,
  status            payment_status NOT NULL DEFAULT 'pendente',
  provider          TEXT NOT NULL,
  provider_id       TEXT,
  amount            NUMERIC(10,2) NOT NULL,
  pix_qr_code       TEXT,
  pix_expires_at    TIMESTAMPTZ,
  boleto_url        TEXT,
  boleto_expires_at TIMESTAMPTZ,
  metadata          JSONB,
  created_at        TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = payments.order_id AND user_id = auth.uid())
  );

-- ── Coupons ──────────────────────────────────────────────────
CREATE TABLE coupons (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code         TEXT UNIQUE NOT NULL,
  type         TEXT NOT NULL,  -- 'percent' | 'fixed' | 'shipping'
  value        NUMERIC(10,2) NOT NULL,
  min_order    NUMERIC(10,2) DEFAULT 0,
  max_uses     INT,
  used_count   INT DEFAULT 0,
  valid_from   TIMESTAMPTZ,
  valid_until  TIMESTAMPTZ,
  active       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Reviews ──────────────────────────────────────────────────
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id),
  order_id    UUID REFERENCES orders(id),
  rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  verified    BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read reviews" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "own write reviews"   ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Points Transactions ──────────────────────────────────────
CREATE TABLE points_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id),
  delta       INT NOT NULL,
  type        TEXT NOT NULL,  -- 'earn' | 'redeem' | 'expire' | 'adjust'
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own points" ON points_transactions FOR SELECT USING (auth.uid() = user_id);

-- Stored procedure: incremento atômico de pontos (evita race condition)
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, amount INT)
RETURNS VOID AS $$
  UPDATE profiles
  SET points = points + amount, updated_at = now()
  WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── Stored Procedure: KPIs ────────────────────────────────────
CREATE OR REPLACE FUNCTION get_revenue_summary()
RETURNS TABLE(date DATE, revenue NUMERIC, orders BIGINT) AS $$
  SELECT
    date_trunc('day', created_at)::DATE AS date,
    SUM(total)                          AS revenue,
    COUNT(*)                            AS orders
  FROM orders
  WHERE
    status != 'cancelado'
    AND created_at >= now() - INTERVAL '30 days'
  GROUP BY 1
  ORDER BY 1;
$$ LANGUAGE sql SECURITY DEFINER;
