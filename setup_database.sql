-- ============================================================
-- SQL ÚNICO — Idempotente, roda quantas vezes quiser
-- ============================================================

-- 1. PERFIS (referenciado por comandas e pedidos)
CREATE TABLE IF NOT EXISTS perfis (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'atendente' CHECK (role IN ('dono', 'atendente', 'churrasqueiro')),
  created_at timestamp with time zone DEFAULT now()
);

-- 2. COMANDA
CREATE TABLE IF NOT EXISTS comandas (
  codigo varchar(10) PRIMARY KEY CHECK (codigo ~ '^C\d{3}$'),
  status varchar(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  preco_kg numeric(10, 2) DEFAULT 48.90,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  closed_at timestamp with time zone,
  closed_by uuid REFERENCES perfis(id)
);

-- 3. PEDIDOS (com suporte a comanda_codigo)
CREATE TABLE IF NOT EXISTS pedidos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mesa varchar(50) CHECK (mesa IS NULL OR mesa ~ '^[1-8]$'),
  comanda_codigo varchar(10) REFERENCES comandas(codigo),
  status varchar(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  itens jsonb NOT NULL,
  total numeric(10, 2) NOT NULL CHECK (total > 0),
  tipo varchar(50) DEFAULT 'mesa',
  observacao text,
  client_token uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
  ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS client_token uuid;
  ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS comanda_codigo varchar(10) REFERENCES comandas(codigo);
  ALTER TABLE pedidos ALTER COLUMN mesa DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. CONFIGURAÇÕES
CREATE TABLE IF NOT EXISTS configuracoes (
  chave varchar(50) PRIMARY KEY,
  valor jsonb NOT NULL
);

-- 5. CONFIGURAÇÃO INICIAL
INSERT INTO configuracoes (chave, valor) VALUES ('pratos_do_dia', '[]'::jsonb) ON CONFLICT (chave) DO NOTHING;

-- 6. REALTIME
DO $$ BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE pedidos; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE comandas; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE configuracoes; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE perfis; EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos, comandas, configuracoes, perfis;

-- 7. TRIGGER: Valida pedido e recalcula total no servidor
CREATE OR REPLACE FUNCTION public.validar_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item record;
  soma numeric(10, 2) := 0;
BEGIN
  IF NEW.status IS NULL THEN
    NEW.status := 'pendente';
  END IF;

  IF NEW.status NOT IN ('pendente', 'pago') THEN
    RAISE EXCEPTION 'Status inválido: %', NEW.status;
  END IF;

  IF NEW.mesa IS NOT NULL AND NEW.mesa !~ '^[1-8]$' THEN
    RAISE EXCEPTION 'Mesa inválida: %', NEW.mesa;
  END IF;

  IF NEW.comanda_codigo IS NOT NULL AND NEW.comanda_codigo !~ '^C\d{3}$' THEN
    RAISE EXCEPTION 'Código de comanda inválido: %', NEW.comanda_codigo;
  END IF;

  IF NEW.mesa IS NULL AND NEW.comanda_codigo IS NULL THEN
    RAISE EXCEPTION 'É necessário informar mesa ou comanda';
  END IF;

  FOR item IN SELECT * FROM jsonb_to_recordset(NEW.itens) AS x(name text, price numeric, quantity int, category text)
  LOOP
    IF item.name IS NULL OR trim(item.name) = '' THEN
      RAISE EXCEPTION 'Item sem nome não é permitido';
    END IF;
    IF item.quantity < 1 OR item.quantity > 99 THEN
      RAISE EXCEPTION 'Quantidade inválida para item: %', item.name;
    END IF;
    IF item.price < 0 THEN
      RAISE EXCEPTION 'Preço inválido para item: %', item.name;
    END IF;
    IF item.price > 0 THEN
      soma := soma + (item.price * item.quantity);
    END IF;
  END LOOP;

  NEW.total := soma;

  IF NEW.observacao IS NOT NULL THEN
    NEW.observacao := trim(left(NEW.observacao, 500));
    NEW.observacao := regexp_replace(NEW.observacao, '<[^>]+>', '', 'g');
    NEW.observacao := regexp_replace(NEW.observacao, '&[a-zA-Z0-9#]+;', '', 'g');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_pedido ON pedidos;
CREATE TRIGGER trg_validar_pedido
  BEFORE INSERT OR UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_pedido();

-- 8. TRIGGER: Rate limit — máximo 1 pedido por comanda/mesa a cada 2s
CREATE OR REPLACE FUNCTION public.rate_limit_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_created timestamp with time zone;
  lookup_key text;
BEGIN
  lookup_key := COALESCE(NEW.comanda_codigo, NEW.mesa);
  IF lookup_key IS NULL THEN RETURN NEW; END IF;

  SELECT MAX(created_at) INTO last_created
  FROM pedidos
  WHERE (comanda_codigo = lookup_key OR mesa = lookup_key)
    AND created_at > now() - interval '2 seconds';

  IF last_created IS NOT NULL THEN
    RAISE EXCEPTION 'Aguardar 2s antes de novo pedido na comanda/mesa %', lookup_key;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rate_limit_pedido ON pedidos;
CREATE TRIGGER trg_rate_limit_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.rate_limit_pedido();

-- 9. RLS — PEDIDOS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pedidos_staff_select" ON pedidos;
DROP POLICY IF EXISTS "pedidos_staff_update" ON pedidos;
DROP POLICY IF EXISTS "pedidos_staff_insert" ON pedidos;
DROP POLICY IF EXISTS "pedidos_delete_deny" ON pedidos;

CREATE POLICY "pedidos_staff_select" ON pedidos FOR SELECT USING (auth.uid() IN (SELECT id FROM perfis));
CREATE POLICY "pedidos_staff_update" ON pedidos FOR UPDATE USING (auth.uid() IN (SELECT id FROM perfis));
CREATE POLICY "pedidos_staff_insert" ON pedidos FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM perfis));
CREATE POLICY "pedidos_delete_deny" ON pedidos FOR DELETE USING (false);

-- 10. RPC: Consulta pública de comanda (usado pela ComandaView)
CREATE OR REPLACE FUNCTION public.get_comanda_data(p_codigo varchar)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_comanda jsonb;
  v_pedidos jsonb;
BEGIN
  IF p_codigo !~ '^C\d{3}$' THEN
    RAISE EXCEPTION 'Código de comanda inválido';
  END IF;

  SELECT jsonb_build_object(
    'codigo', c.codigo,
    'status', c.status,
    'preco_kg', c.preco_kg,
    'created_at', c.created_at,
    'closed_at', c.closed_at
  ) INTO v_comanda
  FROM comandas c
  WHERE c.codigo = p_codigo;

  IF v_comanda IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'tipo', p.tipo,
      'status', p.status,
      'itens', p.itens,
      'total', p.total,
      'created_at', p.created_at
    ) ORDER BY p.created_at ASC
  ), '[]'::jsonb) INTO v_pedidos
  FROM pedidos p
  WHERE p.comanda_codigo = p_codigo;

  result := jsonb_build_object(
    'comanda', v_comanda,
    'pedidos', v_pedidos
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_comanda_data(varchar) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_comanda_data(varchar) TO anon;
GRANT EXECUTE ON FUNCTION public.get_comanda_data(varchar) TO authenticated;

-- RPC antigo mantido para compatibilidade
CREATE OR REPLACE FUNCTION public.get_table_orders(table_num int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF table_num < 1 OR table_num > 8 THEN
    RAISE EXCEPTION 'Mesa inválida';
  END IF;
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'status', p.status,
      'itens', p.itens,
      'total', p.total,
      'created_at', p.created_at
    )
  ), '[]'::jsonb)
  INTO result
  FROM pedidos p
  WHERE p.mesa = table_num::text
    AND p.status = 'pendente'
  ORDER BY p.created_at ASC;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_table_orders(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_table_orders(int) TO anon;
GRANT EXECUTE ON FUNCTION public.get_table_orders(int) TO authenticated;

-- 11. RPC: Gerar próximo código de comanda
CREATE OR REPLACE FUNCTION public.next_comanda_codigo()
RETURNS varchar
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 2) AS integer)), 0) + 1 INTO next_num
  FROM comandas;
  IF next_num > 999 THEN
    next_num := 1;
  END IF;
  RETURN 'C' || LPAD(next_num::text, 3, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_comanda_codigo() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_comanda_codigo() TO authenticated;

-- 12. RLS — COMANDA
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comandas_staff_select" ON comandas;
DROP POLICY IF EXISTS "comandas_staff_insert" ON comandas;
DROP POLICY IF EXISTS "comandas_staff_update" ON comandas;
DROP POLICY IF EXISTS "comandas_staff_delete" ON comandas;

CREATE POLICY "comandas_staff_select" ON comandas FOR SELECT USING (auth.uid() IN (SELECT id FROM perfis));
CREATE POLICY "comandas_staff_insert" ON comandas FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM perfis));
CREATE POLICY "comandas_staff_update" ON comandas FOR UPDATE USING (auth.uid() IN (SELECT id FROM perfis));
CREATE POLICY "comandas_staff_delete" ON comandas FOR DELETE USING (false);

-- 13. RLS — CONFIGURAÇÕES
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conf_ler" ON configuracoes;
DROP POLICY IF EXISTS "conf_inserir" ON configuracoes;
DROP POLICY IF EXISTS "conf_atualizar" ON configuracoes;

CREATE POLICY "conf_ler" ON configuracoes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "conf_inserir" ON configuracoes FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM perfis WHERE role = 'dono'));
CREATE POLICY "conf_atualizar" ON configuracoes FOR UPDATE USING (auth.uid() IN (SELECT id FROM perfis WHERE role = 'dono'));

-- 14. RLS — PERFIS
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfis_select" ON perfis;
DROP POLICY IF EXISTS "perfis_insert" ON perfis;
DROP POLICY IF EXISTS "perfis_update_self" ON perfis;
DROP POLICY IF EXISTS "perfis_update_dono" ON perfis;

CREATE POLICY "perfis_select" ON perfis FOR SELECT USING (auth.uid() = id);
CREATE POLICY "perfis_insert" ON perfis FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "perfis_update_self" ON perfis FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
CREATE POLICY "perfis_update_dono" ON perfis FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM perfis WHERE role = 'dono'));

-- 15. TRIGGER: Cria perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfis (id, email, role)
  VALUES (new.id, new.email, 'atendente')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 16. CADASTRO DOS PERFIS
DO $$
DECLARE
  v_dono_id uuid;
  v_atendente_id uuid;
BEGIN
  SELECT id INTO v_dono_id FROM auth.users WHERE email = 'dono@finosabor.com';
  SELECT id INTO v_atendente_id FROM auth.users WHERE email = 'atendente@finosabor.com';

  IF v_dono_id IS NOT NULL THEN
    INSERT INTO perfis (id, email, role)
    VALUES (v_dono_id, 'dono@finosabor.com', 'dono')
    ON CONFLICT (id) DO UPDATE SET role = 'dono', email = EXCLUDED.email;
  END IF;

  IF v_atendente_id IS NOT NULL THEN
    INSERT INTO perfis (id, email, role)
    VALUES (v_atendente_id, 'atendente@finosabor.com', 'atendente')
    ON CONFLICT (id) DO UPDATE SET role = 'atendente', email = EXCLUDED.email;
  END IF;
END $$;

-- 17. TABELA DE DIVISÃO DE CONTA (SPLIT) — mantida por compatibilidade
CREATE TABLE IF NOT EXISTS split_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id uuid REFERENCES pedidos(id) ON DELETE CASCADE,
  pessoa_nome varchar(100) NOT NULL DEFAULT '',
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  pago boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE split_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "split_staff_select" ON split_payments;
DROP POLICY IF EXISTS "split_staff_insert" ON split_payments;
DROP POLICY IF EXISTS "split_staff_update" ON split_payments;
CREATE POLICY "split_staff_select" ON split_payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "split_staff_insert" ON split_payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "split_staff_update" ON split_payments FOR UPDATE USING (auth.role() = 'authenticated');

-- 18. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos (status);
CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos (mesa);
CREATE INDEX IF NOT EXISTS idx_pedidos_comanda ON pedidos (comanda_codigo);
CREATE INDEX IF NOT EXISTS idx_pedidos_client_token ON pedidos (client_token);
CREATE INDEX IF NOT EXISTS idx_comandas_status ON comandas (status);
CREATE INDEX IF NOT EXISTS idx_comandas_created_at ON comandas (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perfis_email ON perfis (email);
CREATE INDEX IF NOT EXISTS idx_split_payments_pedido ON split_payments (pedido_id);

-- 19. PREVENT ROLE ESCALATION
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'dono') THEN
      RAISE EXCEPTION 'Apenas o dono pode alterar cargos';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON perfis;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- 20. ADDITIONAL CHECKS (idempotent via DO block for ALTER TABLE)
DO $$ BEGIN
  ALTER TABLE pedidos ADD CONSTRAINT pedidos_itens_not_empty CHECK (jsonb_array_length(itens) > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
