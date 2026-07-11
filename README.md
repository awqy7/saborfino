# Sabor Fino

Sistema de gestão para restaurante com cardápio online, POS (ponto de venda), cozinha, caixa e relatórios. Construído com React + Vite + Supabase.

## Funcionalidades

- **Cardápio Online** — Cardápio público com ~150 itens categorizados
- **Pedidos via Mesa** — Clientes fazem pedidos por QR code na mesa
- **POS** — Ponto de venda para atendentes com busca de itens
- **Cozinha** — Painel de pedidos com filtro por estação
- **Caixa** — Fechamento de contas com múltiplas formas de pagamento
- **Dashboard** — Relatórios e métricas do restaurante
- **Impressão** — Monitor de impressão térmica com Supabase Realtime
- **Autenticação** — Login com controle de acesso por função (dono, atendente)

## Tecnologias

- React 19 + Vite 8
- Supabase (auth, banco, Realtime)
- React Router DOM
- ESLint (configurado para React + Hooks)

## Scripts

```bash
npm run dev       # Desenvolvimento
npm run build     # Build de produção
npm run preview   # Preview do build
npm run lint      # ESLint
npm run test      # Testes (vitest)
```

## Deploy

Build gera arquivos estáticos em `dist/`. Configurado para deploy no Netlify via `netlify.toml`.

## Banco de Dados

Execute `setup_database.sql` no painel SQL do Supabase. Inclui:

- Tabelas: `perfis`, `pedidos`, `itens_pedido`
- Row Level Security (RLS) com políticas por função
- Trigger `validar_pedido()` para validação de integridade
- Índices de performance
