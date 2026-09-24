# Arquitetura

Documento vivo: cada card que introduz um invariante ou uma decisão estrutural
acrescenta a sua linha aqui. Regras imperativas ficam em
[GUIDELINES.md](../GUIDELINES.md); aqui fica **onde as coisas moram e por quê**.

## Camadas

Dependência aponta sempre para dentro — `GUIDELINES.md` § Architecture style.

```
src/app/          UI e Server Actions      → chamam domain/ e repository/
src/domain/       regras puras             → não importam nada de I/O
src/repository/   acesso a dados           → único lugar que importa drizzle-orm
drizzle/          migrations versionadas   → geradas por drizzle-kit
```

## Modelo de dados

| Tabela | O que é | Ciclo de vida |
|---|---|---|
| `commitments` | catálogo de compromissos (nome, cor, carga diária opcional) | sobrevive à troca de semana |
| `weeks` | semana identificada pela data da sua segunda-feira; `kind` é `current` ou `next`, único por tipo | no máximo duas vivas; a encerrada é descartada |
| `blocks` | alocação de um compromisso num dia e num intervalo de horas | apagado em cascata com a semana |

Um bloco é um **intervalo** (`start_hour`, `end_hour`), não uma linha por slot de
uma hora. Um bloco de 08:00 às 13:00 é um registro: redimensionar é um `UPDATE`,
e a proporção visual sai do próprio intervalo. A alternativa (uma linha por
slot) tornaria o redimensionamento uma operação em lote e a checagem de
sobreposição uma varredura.

Semana é identificada pela **data da segunda-feira**, não por número de semana
ISO: a convenção de número de semana varia entre bibliotecas e vira bug na
virada de ano.

## Invariantes em duas camadas

Ver `GUIDELINES.md` § Invariantes em duas camadas para as regras. O que existe
hoje:

### Blocos não se sobrepõem

| Camada | Onde | Papel |
|---|---|---|
| Domínio | `src/domain/overlaps.ts` | usado pela UI para recusar um arrasto **antes** de persistir, com mensagem legível |
| Banco | trigger `blocks_no_overlap_on_insert` / `_on_update`, em `drizzle/0001_block_overlap_guard.sql` | última linha de defesa: aborta a escrita mesmo se algum caminho de código esquecer de validar |

As duas metades usam a mesma condição de interseção:
`novo.start < existente.end AND existente.start < novo.end`. Intervalos que se
tocam (um termina às 13:00, outro começa às 13:00) **não** se sobrepõem.

**Estado atual:** até o card #1, apenas a metade do banco está em uso —
`overlaps` existe e está testada, mas nenhum caminho de escrita a chama ainda.
O card #3 é quem liga a metade do domínio, ao validar o drop antes de persistir.
Enquanto isso, uma violação produz um erro de SQLite, não uma mensagem.

### No máximo uma semana de cada tipo

| Camada | Onde |
|---|---|
| Banco | índice único `weeks_kind_unique` sobre `kind` |
| Domínio | ainda não existe — o card #5 adiciona `rolloverPlan`, que nunca deve produzir dois `current` |

`GUIDELINES.md` § Fail-safe exige que uma virada falha nunca deixe o app com
duas semanas `current` nem com nenhuma. O índice único garante isso mesmo se a
transação da virada for escrita errada: a segunda inserção aborta.

### Faixa horária e duração

| Camada | Onde |
|---|---|
| Domínio | `FIRST_HOUR`, `LAST_HOUR`, `HOURS_PER_DAY` em `src/domain/hours.ts` |
| Banco | `CHECK` `blocks_within_day` e `blocks_positive_duration`, declarados no `schema.ts` |

Os literais `6`, `23` e `17` aparecem nos dois lados porque SQL não importa
constante de TypeScript. Ao mudar a faixa da grade, mude os dois.

## Migrations

Geradas por `drizzle-kit generate` a partir do `schema.ts` e aplicadas pelo
`migrate()` oficial do Drizzle, que registra o que já rodou em
`__drizzle_migrations` — por isso aplicar duas vezes é seguro, e o container
pode rodar a migração em todo boot.

SQL que o `drizzle-kit` não sabe gerar (as triggers) entra como migration custom
(`drizzle-kit generate --custom`), no mesmo journal e sob o mesmo controle.

## Banco em produção

SQLite num arquivo apontado por `DATABASE_PATH`, montado num PVC no k3s. Réplica
única e `strategy: Recreate`: dois processos escrevendo no mesmo arquivo
corrompem o banco.
