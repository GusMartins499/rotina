# Rotina

Organizador de rotina semanal: uma grade de segunda a domingo, das 06:00 às
23:00, onde você arrasta o compromisso para o horário e **reorganizar custa um
arrasto**.

*[Read this in English](README.en.md)*

![A semana montada na grade](docs/images/semana.png)

![O preview do redimensionamento, vermelho quando o destino colide com outro bloco](docs/images/redimensionar.png)

## Por que existe

Minha rotina vivia numa planilha. Montar dava trabalho; **reorganizar** dava
trabalho demais — mexer em células, recalcular horários, realinhar o resto do
dia. Então algo mudava na quarta e, em vez de refazer tudo, eu largava o plano.

O problema nunca foi planejar: era reorganizar. Daí o único critério que
importa aqui: **mudou algo na quarta, a reorganização acontece em segundos**.

## Arrastar, redimensionar, mover

![Arrastar um compromisso para a grade, redimensionar e mover](docs/images/arrastar.gif)

## Carga semanal fácil

![Popover de carga semanal](docs/images/carga-semanal.png)

## Compromissos e rotina base

Compromissos (nome, cor, carga diária) e rotina base ficam nas configurações. A
rotina base é a sua semana padrão

![Drawer de configurações](docs/images/configuracoes.png)

## Duas semanas, uma virada

A semana atual e a próxima existem ao mesmo tempo e são editáveis

## No celular

A semana empilha os dias e continua legível no celular. Arrastar pra editar é
coisa de desktop.

<img src="docs/images/celular.png" alt="A semana no celular" width="320" />

## Rodando localmente

Precisa de Node 20+.

```bash
npm install
npm run db:migrate
npm run dev
```

Sobe em `http://localhost:3000` e o banco nasce em `./data/rotina.db`. Pra
apontar pra outro arquivo, use `DATABASE_PATH`.
