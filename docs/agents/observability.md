# Observability

App pessoal, usuário único, acessível apenas pelo tailnet. Não há stack de
observabilidade e não se justifica uma: o "dashboard" é o próprio app aberto na
tela. Logs vão para stdout do container e são lidos com `kubectl logs`.

```
platform: none
logger: console
conventions: none
```
