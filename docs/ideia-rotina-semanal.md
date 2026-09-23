# Rascunho — organizador de rotina semanal (extraído do Excalidraw)

Fonte: https://excalidraw.com/#json=wrci-2P1mqM7j1OfLPrPa,wgl_BgbAlZRjZEeou5OO7A

## A ideia
Definir compromissos e **arrastar** eles para encaixar na rotina da semana, nos
horários e dias que o usuário quiser.

## Telas rascunhadas
1. **Tela principal** — grade semanal (SEGUNDA→DOMINGO × horários 07:00, 08:00,
   13:00, 14:00, 17:00...), com blocos de compromisso (FLASHCARDS, TRABALHO...).
   Cabeçalho: "Semana do dia DD/MM até DD/MM de YYYY". Ícone de engrenagem abre
   o drawer de configuração.
2. **Tela de organizar a próxima semana** — mesma grade + **drawer lateral**
   com a lista de compromissos para arrastar, e um bloco "Carga semanal de
   estudo" (Flashcards: XX h/semana, LeetCode: XX h/semana, Projeto Portfolio:
   XX h/semana, Curso Galego/RocketSeat: XX h/semana).
3. **Próxima semana configurada** — mesma tela com "Voltar a semana atual",
   drawer fechado.

## Regras de negócio capturadas no rascunho
- **Carga horária diária por compromisso.** Ex.: TRABALHO com carga diária de 8h
  pode ser distribuído 5h seg–sex (08:00–13:00) + 3h (14:00–17:00).
- **Proporcionalidade visual**: o bloco no drawer/grade deve ser proporcional à
  quantidade de horas (ex.: "5h" ↔ altura do bloco). *Desafio principal de UI.*
- **Compromissos eventuais** (RPG, psicólogo...) aparecem na lista mas **não**
  seguem a proporção de horas — são só listados.
- **Configuração da próxima semana**: pela engrenagem. A semana sempre começa na
  segunda; então aos domingos dá para configurar a próxima.
- A próxima semana fica **salva no banco** mas só aparece na tela principal
  quando a nova segunda começar. Antes disso, uma **notificação/atalho** na tela
  principal alterna entre "semana atual" e "próxima semana"; a semana atual se
  encerra domingo à meia-noite.
- **Sem botão "salvar semana"** — cada interação (adicionar/remover) salva no
  banco. Feedback "Salvando ...".
- **Remover compromisso**: desktop → arrastar para fora da tela. Mobile →
  pressionar 2s, o bloco "treme" e aparece um X vermelho; clicar remove.
- **Sem histórico**: não é preciso guardar semanas passadas — pode apagar a
  semana sempre que uma nova for configurada.

## Lacunas para a entrevista do /create-product
- Qual é o problema concreto e o critério de sucesso mensurável?
- É só web desktop ou desktop + mobile (o rascunho cita gesto mobile)?
- Multiusuário / login? Ou single-user local?
- Cadastro de compromissos: onde se cria um compromisso novo e sua carga diária?
- "Carga semanal de estudo" é meta configurável ou só um resumo do que foi alocado?
- Conflito de horários (dois compromissos no mesmo slot) — permitido?
