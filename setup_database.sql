-- SQL Completo e à Prova de Erros para rodar no Supabase

-- 1. Criação das Tabelas (Ignora se já existirem)
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

-- 2. Insere a configuração inicial
INSERT INTO configuracoes (chave, valor) VALUES ('pratos_do_dia', '[]'::jsonb) ON CONFLICT (chave) DO NOTHING;

-- 3. Configuração do Realtime (Remove antes de adicionar para evitar erro 42710)
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

-- 4. Segurança (RLS)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para não dar erro
DROP POLICY IF EXISTS "Permitir leitura pública" ON pedidos;
DROP POLICY IF EXISTS "Permitir inserção pública" ON pedidos;
DROP POLICY IF EXISTS "Permitir atualização pública" ON pedidos;

DROP POLICY IF EXISTS "Permitir leitura pública configs" ON configuracoes;
DROP POLICY IF EXISTS "Permitir atualização pública configs" ON configuracoes;
DROP POLICY IF EXISTS "Permitir inserção pública configs" ON configuracoes;

-- Cria políticas novas
CREATE POLICY "Permitir leitura pública" ON pedidos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública" ON pedidos FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura pública configs" ON configuracoes FOR SELECT USING (true);
CREATE POLICY "Permitir atualização pública configs" ON configuracoes FOR UPDATE USING (true);
CREATE POLICY "Permitir inserção pública configs" ON configuracoes FOR INSERT WITH CHECK (true);

-- 5. Políticas da tabela perfis
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura autenticado perfil" ON perfis;
DROP POLICY IF EXISTS "Permitir inserção admin perfil" ON perfis;

CREATE POLICY "Permitir leitura autenticado perfil" ON perfis FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção admin perfil" ON perfis FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização admin perfil" ON perfis FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. Instrução para cadastrar perfis (rode no SQL Editor do Supabase)
-- ================================================================
-- EXEMPLO: Cadastrar dono (troque pelo email real do dono)
-- INSERT INTO auth.users (email) VALUES ('dono@finosabor.com') ON CONFLICT DO NOTHING;
-- 
-- Depois de criar o usuário no Authentication do Supabase, rode:
-- INSERT INTO perfis (id, email, role)
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'dono@finosabor.com'),
--   'dono@finosabor.com',
--   'dono'
-- );
--
-- INSERT INTO perfis (id, email, role)
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'atendente@finosabor.com'),
--   'atendente@finosabor.com',
--   'atendente'
-- );
