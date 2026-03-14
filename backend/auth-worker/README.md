# Omnia Auth (Cloudflare Worker + D1)

Este Worker fornece login, sessao e um endpoint de admin para criar usuarios.

## 1) Criar o banco D1
1. No Cloudflare Dashboard: D1 > Create Database
2. Copie o `database_id` e coloque no `wrangler.toml`.

## 2) Aplicar o schema
No terminal, dentro de `backend/auth-worker`:
1. `wrangler d1 execute omnia_auth --file schema.sql`

## 3) Criar bucket R2 (fotos)
1. Cloudflare Dashboard > R2 > Create bucket
2. Use o mesmo nome configurado em `wrangler.toml` (ex: `omnia-albums`).

## 4) Configurar segredo admin
1. `wrangler secret put ADMIN_TOKEN`
2. Digite um token forte (guarde esse valor).

## 5) Ajustar origens permitidas
Edite `ALLOWED_ORIGINS` no `wrangler.toml` (ex: `https://omniaprod.pt,https://www.omniaprod.pt`).

## 6) Deploy do Worker
`wrangler deploy`

## 7) Criar usuarios (convite)
Use o endpoint admin:

```
POST /api/admin/users
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "email": "cliente@empresa.com",
  "password": "SenhaForte123",
  "role": "client"
}
```

## 8) Inserir cards e arquivos do dashboard

### Card
```
POST /api/admin/cards
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "email": "cliente@empresa.com",
  "title": "Status do projeto",
  "meta": "Atualizado hoje",
  "body": "Em producao. Proxima entrega: cortes finais.",
  "action_label": "Ver cronograma",
  "action_url": "https://exemplo.com"
}
```

### Arquivo
```
POST /api/admin/files
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "email": "cliente@empresa.com",
  "name": "Omnia_Storyboard.pdf",
  "status": "Disponivel",
  "date_label": "Hoje"
}
```

## 9) Inserir packs de foto/video
```
POST /api/admin/packs
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "email": "cliente@empresa.com",
  "title": "Pack Fotos Fevereiro",
  "url": "https://seulink.com/pasta"
}
```

## 10) Calendario (usuario logado)
```
POST /api/calendar
Content-Type: application/json
Cookie: session=...

{
  "title": "Revisao de cortes",
  "date": "2026-02-06",
  "notes": "Aprovar versao final"
}
```

## 11) Upload de fotos (usuario logado)
Endpoint multipart (fotos para galerias):

```
POST /api/albums/{albumId}/upload
Cookie: session=...
Content-Type: multipart/form-data

files: (1..12 imagens)
```

Lista publica de fotos do album:
```
GET /api/albums/{albumId}/assets
```

## 12) Rotas no Cloudflare
Crie uma rota para o Worker:
`omniaprod.pt/api/*`

Assim o front-end usa `/api/login`, `/api/me` e `/api/logout`.
