# Rotina

Organizador de rotina semanal: uma grade de segunda a domingo, das 06:00 às
23:00, onde o compromisso é arrastado para o horário e **remanejar custa um
arrasto**.

![A semana montada na grade](docs/images/semana.png)

## Por que existe

A rotina vivia numa planilha. Montar dava trabalho; **remanejar** dava trabalho
demais — mexer em células, recalcular horários, realinhar o resto do dia. Na
quarta-feira a semana planejada já não correspondia à semana real e a planilha
virava ficção.

O problema nunca foi planejar. Era o plano não sobreviver ao contato com a
semana, porque ajustá-lo dava mais trabalho do que ignorá-lo. Daí o único
critério que importa aqui: **mudou algo na quarta, o remanejo acontece em
segundos**.

## Arrastar, redimensionar, mover

![Arrastar um compromisso para a grade, redimensionar e mover](docs/images/arrastar.gif)

A gaveta de compromissos abre por um botão, sai da frente assim que você começa
a arrastar e **fecha sozinha** quando o bloco é solto. Cada gesto grava na hora:
não existe botão de salvar nem estado de rascunho.

| Gesto | O que acontece |
|---|---|
| Arrastar da gaveta para um slot | aloca o bloco com a carga diária do compromisso |
| Arrastar um bloco para outro slot | move, recusando o destino se já estiver ocupado |
| Arrastar a borda de baixo | fatia a carga (TRABALHO 8h vira 09:00–13:00 + 14:00–18:00) |
| Arrastar o bloco para fora da grade | remove e libera o slot |
| `Espaço` num bloco, setas, `Espaço` | move pelo teclado, com `Esc` para cancelar |
| `Shift` + setas, `Delete` | redimensiona e remove pelo teclado |

O preview mostra o intervalo candidato enquanto você arrasta a borda, e fica
vermelho quando o destino colide com outro bloco:

![Preview do redimensionamento](docs/images/redimensionar.png)

## Ler a semana de relance

Cada bloco carrega o nome do compromisso **e o intervalo** (`09:00–17:00`), e a
grade rotula as meias horas — num calendário de blocos de 30 minutos, saber se
algo começa às 14:00 ou às 14:30 não pode depender de contar linhas.

A carga semanal é derivada dos blocos no render, nunca persistida, e vive num
popover para não ocupar a grade:

![Popover de carga semanal](docs/images/carga-semanal.png)

## Compromissos e rotina base

O catálogo de compromissos (nome, cor, carga diária opcional) e a rotina base
ficam nas configurações. A rotina base é um template da semana padrão, aplicável
a uma semana vazia em um clique:

![Gaveta de configurações](docs/images/configuracoes.png)

## Duas semanas, uma virada

A semana **atual** e a **próxima** existem ao mesmo tempo e são editáveis; a
próxima é configurada no domingo. Na segunda, 00:00, a virada acontece numa
única transação: a próxima vira atual, a encerrada é descartada e nasce uma
próxima vazia. Ou tudo acontece, ou nada acontece — nunca duas semanas `current`
e nunca o usuário sem semana.

## No celular

A semana empilha os dias e continua legível no navegador do celular. A edição
por arrastar é do desktop.

<img src="docs/images/celular.png" alt="A semana no celular" width="320" />

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| App | Next.js 15 (App Router + Server Actions) | monólito, um único caminho de escrita |
| Linguagem | TypeScript | — |
| Banco | SQLite via Drizzle + better-sqlite3 | in-process; o homelab tem ~1 GB livre |
| Drag and drop | `@dnd-kit/core` | — |
| Validação | Zod no limite da Server Action | espelha as restrições do banco |
| Testes | Vitest + Testing Library, Playwright | — |

A lista de dependências é fechada: nada de biblioteca de datas, de biblioteca de
componentes ou de um segundo ORM. Ver [GUIDELINES.md](GUIDELINES.md).

## Arquitetura

Três camadas, com a dependência apontando sempre para dentro:

```
src/app/          UI e Server Actions      → chamam domain/ e repository/
src/domain/       regras puras             → não importam nada de I/O
src/repository/   acesso a dados           → único lugar que importa drizzle-orm
drizzle/          migrations versionadas   → geradas por drizzle-kit
```

Um bloco é um **intervalo** (`startMinute`, `endMinute`), não uma linha por slot:
redimensionar é um `UPDATE` e a proporção visual sai do próprio intervalo. A
não-sobreposição é garantida em duas camadas a partir da mesma condição de
interseção — uma função pura de domínio, que recusa o arrasto com mensagem
legível, e um `trigger` no SQLite, que é a última linha de defesa.

Detalhes em [docs/architecture.md](docs/architecture.md).

## Rodando localmente

Requer Node 20+.

```bash
npm install
npm run db:migrate
npm run dev
```

A aplicação sobe em `http://localhost:3000` e o banco nasce em
`./data/rotina.db`. Para apontar para outro arquivo, use `DATABASE_PATH`.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build e servidor de produção |
| `npm test` | testes de unidade e de componente (Vitest) |
| `npm run test:e2e` | testes de ponta a ponta (Playwright, banco próprio) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | gera migration a partir do schema |
| `npm run db:migrate` | aplica as migrations |

## Deploy

Homelab em k3s, com sidecar Tailscale e o banco num PVC `local-path`. Sem
exposição pública e sem autenticação: é usuário único, acessado pela tailnet.

## Documentação

- [GUIDELINES.md](GUIDELINES.md) — regras de estilo, arquitetura e dependências
- [docs/architecture.md](docs/architecture.md) — onde as coisas moram e por quê
- [docs/product/organizador-de-rotina-semanal.md](docs/product/organizador-de-rotina-semanal.md) — problema, escopo e critérios de aceite
