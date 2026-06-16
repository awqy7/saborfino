-- ============================================================
-- SQL ÚNICO — Roda no SQL Editor do Supabase (tudo ou nada)
-- ============================================================

-- 1. CRIAÇÃO DAS TABELAS
CREATE TABLE IF NOT EXISTS pedidos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mesa varchar(50),
  cliente_nome varchar(255),
  status varchar(50) DEFAULT 'pendente',
  itens jsonb NOT NULL,
  total numeric(10, 2) NOT NULL,
  tipo varchar(50) DEFAULT 'mesa',
  observacao text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- 3. REALTIME
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

-- 4. RLS — PEDIDOS (acesso público)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública" ON pedidos;
DROP POLICY IF EXISTS "Permitir inserção pública" ON pedidos;
DROP POLICY IF EXISTS "Permitir atualização pública" ON pedidos;

CREATE POLICY "Permitir leitura pública" ON pedidos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública" ON pedidos FOR UPDATE USING (true);

-- 5. RLS — CONFIGURAÇÕES (acesso público)
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública configs" ON configuracoes;
DROP POLICY IF EXISTS "Permitir atualização pública configs" ON configuracoes;
DROP POLICY IF EXISTS "Permitir inserção pública configs" ON configuracoes;

CREATE POLICY "Permitir leitura pública configs" ON configuracoes FOR SELECT USING (true);
CREATE POLICY "Permitir atualização pública configs" ON configuracoes FOR UPDATE USING (true);
CREATE POLICY "Permitir inserção pública configs" ON configuracoes FOR INSERT WITH CHECK (true);

-- 6. RLS — PERFIS (apenas autenticados)
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura autenticado perfil" ON perfis;
DROP POLICY IF EXISTS "Permitir inserção admin perfil" ON perfis;
DROP POLICY IF EXISTS "Permitir atualização admin perfil" ON perfis;

CREATE POLICY "Permitir leitura autenticado perfil" ON perfis FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção admin perfil" ON perfis FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização admin perfil" ON perfis FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. CADASTRO DOS PERFIS (troque os e-mails pelos seus)
-- Os usuários precisam existir no Authentication do Supabase primeiro.

INSERT INTO perfis (id, email, role)
VALUES
  ((SELECT id FROM auth.users WHERE email = 'dono@finosabor.com'), 'dono@finosabor.com', 'dono'),
  ((SELECT id FROM auth.users WHERE email = 'atendente@finosabor.com'), 'atendente@finosabor.com', 'atendente')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
