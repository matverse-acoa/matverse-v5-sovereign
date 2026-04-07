# MatVerse V5 Sovereign - Project TODO

## Core Infrastructure
- [x] Motor Ω-GATE V5 com equação central (0.4Ψ + 0.3Θ̂ + 0.2(1−CVaR) + 0.1⋅PoLE)
- [x] Ledger imutável append-only com SHA-256 e encadeamento de hashes
- [x] Merkle Tree para auditoria criptográfica
- [x] Integração Web3 (Sepolia testnet) para ancoragem on-chain
- [x] API de replay determinística (Pipeline Π = L ∘ Ω ∘ A ∘ M ∘ E ∘ O ∘ I)

## Database Schema
- [x] Tabela de eventos (ledger_events) com hash, timestamp, metrics
- [x] Tabela de decisões Ω-GATE com Ω, decision, metrics
- [x] Tabela de provas criptográficas (merkle_proofs) com root, timestamp
- [x] Tabela de ancoragens on-chain (chain_anchors) com tx_hash, block_number

## Backend APIs
- [x] POST /api/trpc/omega.evaluate - Avaliar métricas e gerar decisão Ω-GATE
- [x] GET /api/trpc/ledger.history - Recuperar histórico de eventos com filtros
- [x] POST /api/trpc/chain.anchor - Ancorar Merkle Root na Sepolia
- [x] GET /api/trpc/chain.verify - Verificar prova criptográfica on-chain
- [x] GET /api/public/proof/:merkleRoot - Endpoint público para consulta de provas
- [x] POST /api/trpc/replay.execute - Executar replay determinístico de pipeline

## Frontend Dashboard (VibeCoding)
- [x] Página de autenticação com OAuth Manus
- [x] Dashboard principal com visualização de fluxo (Ψ, CVaR, Ω)
- [x] Gráfico de evolução de coerência (Ψ) em tempo real
- [x] Gráfico de evolução de risco (CVaR) em tempo real
- [x] Tabela de decisões Ω-GATE com status (PASS/BLOCK)
- [x] Visualização de ledger com histórico de eventos
- [x] Painel de ancoragens on-chain com status de confirmação
- [x] Página de replay com entrada de parâmetros e reprodução de estado
- [x] Página de auditoria com verificação de integridade criptográfica

## Access Control & Security
- [x] Sistema de roles (admin/user) com separação de papéis
- [x] Proteção de endpoints críticos com autenticação
- [x] Validação de integridade em todas as operações
- [x] Logging de auditoria para todas as ações

## Documentation & Testing
- [x] AUDIT_REPORT_V5.md com evidência de execução soberana
- [x] Testes de integridade do Merkle Tree
- [x] Testes de determinismo da pipeline Π
- [x] Testes de integração Web3 (Sepolia)
- [x] Documentação técnica consolidada

## Deployment
- [x] Checkpoint inicial após implementação core
- [x] Testes de produção e validação
- [x] Checkpoint final antes de entrega
