# Validation

Stack definida após o desenho de UX: Next.js 15 + TypeScript (monólito, App
Router + Server Actions), SQLite via Drizzle + better-sqlite3, banco em PVC
`local-path` no k3s. Deploy simples (imagem no ghcr + manifest aplicado à mão),
sem GitOps — Argo CD não cabe na máquina (ver docs/product).

```
lint: npm run lint
typecheck: npm run typecheck
test: npm run test
e2e: pending (card #3 — Playwright)
pr_size_budget: 500
guidelines: GUIDELINES.md, AGENTS.md
```
