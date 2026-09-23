# Organizador de rotina semanal

## Problem

Reorganizar a semana custa caro demais. Hoje a rotina vive numa planilha
(`rotina-de-estudos.ods`): montar e, principalmente, **remanejar** um
compromisso exige mexer em células, recalcular horários e realinhar o resto do
dia. O custo é tão alto que o replanejamento simplesmente não acontece — na
quarta-feira a semana planejada já não corresponde à semana real, e a planilha
vira ficção.

O problema não é planejar. É que o plano não sobrevive ao contato com a semana,
porque ajustá-lo dá mais trabalho do que ignorá-lo.

## Who it's for

Uso pessoal, um único usuário: alguém com uma rotina composta de blocos fixos
de carga horária (trabalho 8h/dia) e blocos de estudo distribuídos (flashcards,
LeetCode, projeto de portfólio, curso), que precisa encaixar os dois na mesma
semana e rearranjá-los quando a realidade muda.

## Success criteria

O critério central é o **custo de ajuste no meio da semana**: mudou algo na
quarta, o remanejo acontece em segundos, e por isso acontece de fato.

- Mover um compromisso de um slot para outro é uma única interação de arrastar,
  sem confirmação e sem etapa de salvar.
- Ao longo de 4 semanas de uso, a semana exibida no app corresponde à semana
  real — ou seja, os ajustes foram feitos em vez de abandonados.
- A planilha `.ods` deixa de ser aberta para planejar a semana.

## Scope

### In

- **Grade semanal** de segunda a domingo, das 06:00 às 23:00, com granularidade
  de 1 hora.
- **Duas semanas** existem simultaneamente: a atual e a próxima. Ambas são
  totalmente editáveis; alternar entre elas é só mudar o foco da tela.
- **Cadastro de compromissos** em lugar próprio, fora da grade: nome, carga
  horária diária (opcional) e cor. Compromissos sobrevivem à troca de semana.
- **Drag-and-drop** do drawer lateral para a grade, e de slot para slot dentro
  da grade.
- **Redimensionar** um bloco arrastando a borda, para fatiar a carga diária
  (ex.: TRABALHO 8h/dia alocado como 08:00–13:00 e 14:00–17:00).
- **Remoção** arrastando o bloco para fora da tela; o slot é liberado.
- **Carga diária como meta**: o drawer mostra o restante não alocado do dia
  ("faltam 3h") sem bloquear nem alertar.
- **Compromissos sem carga diária** ("eventuais", como RPG ou psicólogo) usam a
  mesma grade e a mesma interação; apenas não têm meta a cumprir nem restante a
  exibir.
- **Slot ocupado não aceita** um segundo compromisso: sem sobreposição.
- **Painel de carga semanal**: somatório derivado das horas alocadas por
  compromisso na semana em foco. Somente leitura.
- **Persistência a cada interação**: não existe botão de salvar; adicionar,
  mover, redimensionar ou remover grava imediatamente, com indicador
  "Salvando…".
- **Virada automática na segunda 00:00**: a próxima semana passa a ser a atual,
  a semana encerrada é descartada e uma nova "próxima" nasce vazia.
- **Rotina base**: um template reutilizável da semana padrão, aplicável a uma
  semana em um clique.
- **Layout responsivo**: a semana é legível e navegável no navegador do
  celular; a edição por arrastar é do desktop.

### Out

- Integração com Google Calendar ou qualquer calendário externo.
- Histórico de semanas passadas e estatísticas de horas cumpridas.
- Notificações e lembretes de início de bloco.
- Marcar compromissos como cumpridos (tracking de execução).
- Desfazer (Ctrl+Z) — remover é arrastar para fora, já é reversível na prática.
- Compromissos com dia/hora fixos (recorrência).
- Login, contas e multiusuário.
- Aplicativo nativo Android/iOS — é um web app responsivo.
- Arrastar por toque no celular.

## Acceptance criteria

- **Dado** um compromisso cadastrado com carga diária de 8h, **quando** o
  usuário arrasta o bloco para segunda-feira 08:00 e o redimensiona para 5h,
  **então** o slot 08:00–13:00 de segunda fica ocupado e o drawer indica que
  restam 3h daquele compromisso naquele dia.
- **Dado** um slot já ocupado, **quando** o usuário tenta soltar outro
  compromisso nele, **então** o bloco não é aceito e a grade permanece
  inalterada.
- **Dado** um compromisso alocado na grade, **quando** o usuário o arrasta para
  fora da tela, **então** ele é removido e o slot volta a ficar livre.
- **Dado** qualquer alteração na grade, **quando** ela é concluída, **então** o
  estado é gravado sem ação adicional do usuário e um indicador de salvamento é
  exibido.
- **Dado** um compromisso sem carga diária, **quando** ele é alocado na grade,
  **então** nenhum restante ou meta é exibido para ele.
- **Dado** que a semana atual e a próxima estão configuradas, **quando** chega
  segunda-feira 00:00, **então** a próxima passa a ser exibida como atual, a
  semana encerrada é descartada e uma próxima semana vazia é criada.
- **Dado** uma rotina base salva, **quando** o usuário a aplica a uma semana,
  **então** os compromissos do template são alocados nos mesmos slots.
- **Dado** o app aberto no navegador do celular, **quando** o usuário visualiza
  a semana, **então** o layout se adapta e a semana permanece legível.

## Constraints & dependencies

- **Hospedagem**: homelab do usuário, acessado via tailnet (Tailscale). Não há
  exposição pública — é isso que torna aceitável a ausência de login.
- **Sem autenticação**: usuário único, sem noção de conta no modelo de dados.
- **Persistência server-side obrigatória**: a semana montada no desktop precisa
  aparecer no celular, então armazenamento apenas no navegador não atende.
- **Sem histórico**: semanas encerradas podem ser apagadas; o modelo de dados
  não precisa preservá-las.
- **Stack** (decidida após o desenho de UX): Next.js 15 + TypeScript como
  monólito (App Router + Server Actions), SQLite via Drizzle + better-sqlite3
  com o arquivo num PVC `local-path`, imagem publicada no ghcr e Deployment no
  k3s com sidecar Tailscale — o mesmo padrão já em produção no `tech-calendar`.
- **Orçamento de recursos**: o homelab tem 2 vCPU, 3,7 GB de RAM (≈1 GB livre)
  e nenhum swap. Isso exclui MongoDB (≈300 MB ociosos) e Argo CD (1–1,5 GB), e
  é a razão de o banco ser SQLite in-process e de não haver backend separado.
- **GitOps fora de escopo**: Argo CD não cabe na máquina; o deploy é direto e
  o estudo de Argo CD acontece fora deste projeto.

## Open questions

| Question | Owner | Status |
|---|---|---|
| Qual stack (front, back, banco) atende melhor a UX definida aqui? | Gustavo | **resolvida** — Next.js 15 + TS, SQLite/Drizzle, k3s com sidecar Tailscale |
| O critério de sucesso é ajustar no meio da semana, mas a edição por arrastar é só no desktop. Se na prática os ajustes acontecerem no celular, o v1 não atende — vale reavaliar depois de usar? | Gustavo | aberta |
| Se a próxima semana não for configurada no domingo, a segunda começa vazia. A rotina base mitiga, mas não impede. Aplicar a rotina base automaticamente na virada? | Gustavo | aberta |
| Como o bloco representa visualmente a proporção de horas numa grade de 1h — altura proporcional simples resolve, ou precisa de tratamento especial para blocos longos? | Gustavo — definir no desenho de UI | aberta |
