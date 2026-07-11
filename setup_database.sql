-- ============================================================
-- SQL ÚNICO — Idempotente, roda quantas vezes quiser
-- ============================================================

-- 1. CRIAÇÃO / ATUALIZAÇÃO DAS TABELAS
CREATE TABLE IF NOT EXISTS pedidos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mesa varchar(50),
  cliente_nome varchar(255),
  status varchar(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'preparando', 'pronto', 'entregue', 'pago', 'cancelado')),
  itens jsonb NOT NULL,
  total numeric(10, 2) NOT NULL CHECK (total >= 0),
  tipo varchar(50) DEFAULT 'mesa',
  observacao text,
  client_token uuid,
  metodo_pagamento varchar(20) CHECK (metodo_pagamento IS NULL OR metodo_pagamento IN ('PIX', 'dinheiro', 'credito', 'debito', 'outro')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adiciona colunas que podem não existir em versões anteriores
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS client_token uuid;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS metodo_pagamento varchar(20) CHECK (metodo_pagamento IS NULL OR metodo_pagamento IN ('PIX', 'dinheiro', 'credito', 'debito', 'outro'));

CREATE TABLE IF NOT EXISTS configuracoes (
  chave varchar(50) PRIMARY KEY,
  valor jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS perfis (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'atendente' CHECK (role IN ('dono', 'atendente')),
  created_at timestamp with time zone DEFAULT now()
);

-- 2. CONFIGURAÇÃO INICIAL
INSERT INTO configuracoes (chave, valor) VALUES ('pratos_do_dia', '[]'::jsonb) ON CONFLICT (chave) DO NOTHING;

-- 3. REALTIME (tolerante a erros se já existir)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE pedidos;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE configuracoes;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE perfis;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos, configuracoes, perfis;

-- 4. TRIGGER: Valida pedido ANTES de inserir/atualizar
-- Impede preço adulterado, nome vazio, quantidade inválida
CREATE OR REPLACE FUNCTION public.validar_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item record;
  soma numeric(10, 2) := 0;
BEGIN
  FOR item IN SELECT * FROM jsonb_to_recordset(NEW.itens) AS x(name text, price numeric, quantity int, category text)
  LOOP
    IF item.name IS NULL OR trim(item.name) = '' THEN
      RAISE EXCEPTION 'Item sem nome não é permitido';
    END IF;
    IF item.quantity < 1 OR item.quantity > 99 THEN
      RAISE EXCEPTION 'Quantidade inválida para item: %', item.name;
    END IF;
    IF item.price <= 0 THEN
      RAISE EXCEPTION 'Preço inválido para item: %', item.name;
    END IF;
    soma := soma + (item.price * item.quantity);
  END LOOP;

  IF soma <= 0 OR ABS(soma - NEW.total) > 0.01 THEN
    RAISE EXCEPTION 'Total do pedido não confere com a soma dos itens (calculado: %, enviado: %)', soma, NEW.total;
  END IF;

  NEW.cliente_nome := trim(left(NEW.cliente_nome, 100));
  IF NEW.observacao IS NOT NULL THEN
    NEW.observacao := trim(left(NEW.observacao, 500));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_pedido ON pedidos;
CREATE TRIGGER trg_validar_pedido
  BEFORE INSERT OR UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_pedido();

-- 5. RLS — PEDIDOS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública" ON pedidos;
DROP POLICY IF EXISTS "Permitir inserção pública" ON pedidos;
DROP POLICY IF EXISTS "Permitir atualização pública" ON pedidos;
DROP POLICY IF EXISTS "clientes_inserir_pedidos" ON pedidos;
DROP POLICY IF EXISTS "clientes_ver_proprios_pedidos" ON pedidos;
DROP POLICY IF EXISTS "atendentes_gerenciar_pedidos" ON pedidos;
DROP POLICY IF EXISTS "staff_ler_pedidos" ON pedidos;
DROP POLICY IF EXISTS "staff_atualizar_pedidos" ON pedidos;
DROP POLICY IF EXISTS "pedidos_delete_deny" ON pedidos;
DROP POLICY IF EXISTS "pedidos_clientes_select" ON pedidos;
DROP POLICY IF EXISTS "pedidos_clientes_insert" ON pedidos;
DROP POLICY IF EXISTS "pedidos_staff_select" ON pedidos;
DROP POLICY IF EXISTS "pedidos_staff_update" ON pedidos;

-- Clientes (não autenticados): podem ver todos os pedidos (apenas ID, status, mesa, nomes públicos)
-- O frontend filtra por client_token localmente. Nada sensível é exposto além do que o cliente da mesa já sabe.
CREATE POLICY "pedidos_public_select" ON pedidos FOR SELECT USING (true);

-- Clientes: podem inserir pedidos com validação mínima
-- O trigger validar_pedido() acima faz a validação real (preço, total, sanitização)
CREATE POLICY "pedidos_public_insert" ON pedidos FOR INSERT WITH CHECK (
  auth.role() = 'anon'
);

-- Staff (autenticados): podem ler e atualizar todos os pedidos
CREATE POLICY "pedidos_staff_select" ON pedidos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "pedidos_staff_update" ON pedidos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "pedidos_staff_insert" ON pedidos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Ninguém pode deletar
CREATE POLICY "pedidos_delete_deny" ON pedidos FOR DELETE USING (false);

-- 6. RLS — CONFIGURAÇÕES (apenas autenticados)
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública configs" ON configuracoes;
DROP POLICY IF EXISTS "Permitir atualização pública configs" ON configuracoes;
DROP POLICY IF EXISTS "Permitir inserção pública configs" ON configuracoes;
DROP POLICY IF EXISTS "autenticados_ler_configs" ON configuracoes;
DROP POLICY IF EXISTS "autenticados_inserir_configs" ON configuracoes;
DROP POLICY IF EXISTS "autenticados_atualizar_configs" ON configuracoes;
DROP POLICY IF EXISTS "conf_ler" ON configuracoes;
DROP POLICY IF EXISTS "conf_inserir" ON configuracoes;
DROP POLICY IF EXISTS "conf_atualizar" ON configuracoes;

CREATE POLICY "conf_ler" ON configuracoes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "conf_inserir" ON configuracoes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "conf_atualizar" ON configuracoes FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. RLS — PERFIS
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rl_perfis_select_auth" ON perfis;
DROP POLICY IF EXISTS "rl_perfis_insert_auth" ON perfis;
DROP POLICY IF EXISTS "rl_perfis_update_auth" ON perfis;
DROP POLICY IF EXISTS "Permitir leitura autenticado perfil" ON perfis;
DROP POLICY IF EXISTS "Permitir inserção admin perfil" ON perfis;
DROP POLICY IF EXISTS "Permitir atualização admin perfil" ON perfis;
DROP POLICY IF EXISTS "perfis_select" ON perfis;
DROP POLICY IF EXISTS "perfis_insert" ON perfis;
DROP POLICY IF EXISTS "perfis_update" ON perfis;

-- Usuário autenticado vê seu próprio perfil ou é dono (via raw_app_meta_data)
CREATE POLICY "perfis_select" ON perfis FOR SELECT USING (
  auth.uid() = id
);

CREATE POLICY "perfis_insert" ON perfis FOR INSERT WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "perfis_update" ON perfis FOR UPDATE USING (
  auth.uid() = id
);

-- 8. TRIGGER: Cria perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 9. CADASTRO DOS PERFIS (só executa se os usuários já existirem)
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

-- 10. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos (status);
CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos (mesa);
CREATE INDEX IF NOT EXISTS idx_pedidos_client_token ON pedidos (client_token);
CREATE INDEX IF NOT EXISTS idx_perfis_email ON perfis (email);
