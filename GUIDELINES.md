# Engineering guidelines — rotina

> Precedence: module GUIDELINES.md > codebase GUIDELINES.md > defaults. Guidelines tighten the pipeline's guardrails — they can never loosen them.

## Code style

- Escreva identificadores, tipos, nomes de arquivo e de pasta **em inglês**:
  `commitment`, `week`, `block`, `dailyHours`. Nunca misture idiomas num mesmo
  identificador (`findCompromissoById` é proibido).
- Mantenha o **português apenas nos textos visíveis ao usuário**, isolados na
  camada de apresentação. Nenhuma string de UI dentro de domínio ou repositório.
- **Não escreva comentários**: nem blocos JSDoc, nem comentários inline. Nomes e
  testes carregam o significado.
- Uma armadilha externa que não for óbvia vira **teste com nome descritivo**,
  nunca comentário. Se algo parece exigir comentário, o nome ou o código estão
  errados.

## Architecture style

- Organize o código em três camadas, com dependência apontando **apenas para
  dentro**: UI → domínio → repositório.
- Chame Server Actions a partir de componentes; nunca acesse dados direto do
  componente.
- Mantenha as regras de negócio (sobreposição de intervalos, restante do dia,
  carga semanal, virada de semana) em **funções puras de domínio**, sem importar
  Drizzle nem tocar em I/O — elas precisam ser testáveis sem banco.
- Importe `drizzle-orm` **somente no repositório**. Nenhum outro arquivo conhece
  o ORM.
- Use Server Actions como único caminho de escrita. Não crie rotas de API para
  operações que uma Action resolve.

## Best practices

- Grave toda interação imediatamente. **Não crie botão de salvar** nem estado
  "rascunho não persistido".
- Reverta o estado otimista quando a Action falhar. Um bloco visível que não
  está no banco é pior que uma operação recusada.
- Derive `restante do dia` e `carga semanal` dos blocos no render. **Nunca
  persista valor derivado** — duas fontes de verdade divergem.
- Valide regra de integridade no banco, não só em TypeScript. A não-sobreposição
  de blocos é `trigger`, e a checagem no cliente existe só para feedback.
- Derive a mesma regra de duas camadas a partir de **uma única definição**
  compartilhada (ex.: interseção de intervalos). Não reescreva a regra por
  camada.
- Injete o provedor de data. **Não chame `new Date()`** dentro de lógica de
  domínio — sem isso a virada de semana não é testável.
- Derive limites de constante compartilhada (`6`, `23`, `17` horas). Não espalhe
  número mágico.

## Error handling

- Lance exceção dentro de domínio e repositório: erro ali é excepcional.
- Capture na Server Action e devolva um **result tipado** (`{ ok: false, error }`)
  para a UI renderizar. A UI nunca recebe exceção.
- Valide com Zod no limite da Server Action, espelhando as restrições do banco.
  O banco garante integridade; a Action garante mensagem legível.
- Nomeie na mensagem de erro **o que falhou** — campo, variável ou regra —
  nunca "erro inesperado" sozinho.

## Fail-safe vs fail-fast

- Aplique a virada de semana em **uma única transação**: promover, descartar e
  criar acontecem juntos ou nada acontece.
- Aborte alto quando a virada falhar: abra na semana antiga com erro visível.
  **Nunca deixe o usuário sem semana**, e nunca deixe duas semanas `current`.
- Prefira fail-fast em qualquer operação que apague dado. Degradação silenciosa
  só é aceitável em caminho de leitura.

## Approved libraries & dependency policy

- Use a lista fechada: Next.js, Drizzle ORM, better-sqlite3, Zod, `@dnd-kit/core`,
  Vitest, Testing Library, Playwright.
- Adicione dependência nova **apenas quando escrever à mão for pior**, e escale a
  decisão — nunca adicione em silêncio.
- Não adicione biblioteca de datas (use `Date` e `Intl`), biblioteca de
  componentes inteira, nem um segundo ORM.
- Pese cada adição contra o servidor: 2 vCPU e ~1 GB de RAM livre, sem swap.

## Data & migrations

- Faça mudanças de schema **aditivas primeiro**: adicione antes de remover.
- Versione a migration em arquivo e aplique no boot do container, no **mesmo PR**
  da feature que a exige.
- Nunca execute alteração destrutiva sem que ela seja a própria intenção do card.
  Não há backup: o que se apaga, se perde.

## Accessibility

- Torne todo bloco da grade **focável e movível por teclado**, usando o sensor de
  teclado do `@dnd-kit/core`. Arrastar não pode ser o único caminho.
- Anuncie em `aria-live` o resultado de mover, redimensionar e remover.
- Garanta contraste suficiente para texto sobre cada cor da paleta. A paleta é
  fixa exatamente para que isso seja verificável.
- Mantenha foco visível em todo elemento interativo.

## Logging

- Escreva logs em `console`, sempre para stdout. **Não crie arquivo de log**
  dentro do container — o acesso é por `kubectl logs`.
- Registre em `console.info` toda virada de semana efetuada, nomeando a semana
  promovida e a descartada. É o único rastro de uma operação destrutiva.
- Registre em `console.error` toda falha de persistência, com a operação e o
  identificador afetado.

## Infra provisioning

- Versione os manifests do Kubernetes em `k8s/` neste repositório.
- Use `strategy: Recreate` e `replicas: 1` enquanto o banco for SQLite. Duas
  réplicas no mesmo arquivo corrompem o banco.
- Exponha por Service ClusterIP com **sidecar Tailscale**. Não crie Ingress: a
  ausência de login só é segura porque o acesso é restrito ao tailnet.
- Nunca versione a auth key do Tailscale, nem em manifesto de exemplo.
- Construa a imagem no GitHub Actions, nunca no homelab. O cluster só puxa
  imagem pronta.
- Monte o banco em PVC. Sem volume persistente, todo redeploy zera o app.

## Testing

- Escreva `describe` e `it` **em inglês**, em todo tipo de teste — unitário,
  integração e e2e.
- **Nunca altere um teste para ficar verde**: não afrouxe assertion, não troque
  valor esperado, não use `skip`, não comente nem apague. Teste vermelho é
  informação.
- Investigue a causa antes de tocar em qualquer teste; a hipótese padrão é que o
  **código** quebrou. Se concluir que o teste está errado, diga isso
  explicitamente e espere confirmação.
- Preserve o contrato em refatoração: o que os testes provam antes tem que
  continuar sendo provado depois.
- Teste regra de domínio sem banco; use SQLite em memória para o repositório;
  reserve Playwright para o que só o arrasto real prova.
- Use valores concretos nas asserções (`expect(block.endHour).toBe(13)`), nunca
  "funciona corretamente".

## Commit / branch / PR conventions

- Escreva mensagens de commit **em inglês**, no formato Conventional Commits:
  `tipo(escopo): descrição no imperativo` (`feat`, `fix`, `docs`, `refactor`,
  `test`, `chore`).
- **Nunca inclua o trailer `Co-Authored-By: Claude ...`** em mensagem de commit.
- Crie uma branch por fatia de trabalho, nomeada **em inglês pelo conteúdo** da
  fatia. Não commite na branch em que se está por acaso.
- Commite em `main` apenas com permissão explícita — para commit e para push.
  Autorização anterior não vale para a próxima vez.
- Use a `gh` CLI para operações do GitHub (PR, issue, view).

## Domain criticality

- Trate como **severidade crítica** toda perda silenciosa de alocação: bloco que
  some, gravação que a UI reportou como salva mas não persistiu, virada que
  descarta a semana errada.
- Considere que não há histórico nem backup: dado perdido é irrecuperável. É isso
  que coloca perda de dado acima de erro de render.
- Trate erro de renderização e indisponibilidade da tela como **severidade
  média**: recarregar resolve.
- Trate corrupção do arquivo SQLite como crítica pelo mesmo motivo: é perda de
  dado, não indisponibilidade.
