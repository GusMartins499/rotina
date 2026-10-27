# Deploy no k3s via tailnet

Um Deployment de 1 réplica com dois containers:

- **app** — `ghcr.io/gusmartins499/rotina`, porta 3000. Aplica as migrations
  na subida, antes de atender requisições.
- **tailscale** — sidecar em userspace que junta o pod ao tailnet como o nó
  `rotina` e faz `tailscale serve` de HTTPS → `127.0.0.1:3000`.

O Service é ClusterIP e não há Ingress: o app só é alcançável pelo tailnet, e é
isso que torna aceitável não ter login.

O banco SQLite vive no PVC `rotina-db` (`local-path`, 1Gi), montado em `/data`.
Por isso `strategy: Recreate` e `replicas: 1`: duas réplicas no mesmo arquivo
corrompem o banco. Não há backup — perder o PVC é perder as semanas.

## Pré-requisitos

- MagicDNS e HTTPS certificates habilitados no admin do Tailscale.
- Uma auth key reutilizável, gerada em
  <https://login.tailscale.com/admin/settings/keys>.

## Passos

A imagem é publicada pelo GitHub Actions a cada push na `main`, com a tag
`sha-<commit curto>`. O workflow não aplica nada no cluster.

```sh
kubectl apply -f k8s/namespace.yaml

kubectl -n rotina create secret generic tailscale-auth \
  --from-literal=TS_AUTHKEY='<auth key>'
```

Fixe a tag da imagem em `k8s/kustomization.yaml` (`newTag: sha-<commit>`) e
aplique:

```sh
kubectl apply -k k8s/
kubectl -n rotina get pods -w
kubectl -n rotina logs deploy/rotina -c app
```

Com o pod `Running`, o app responde em `https://rotina.<tailnet>.ts.net`.

A auth key nunca entra no repositório, nem em manifesto de exemplo.
