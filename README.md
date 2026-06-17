# To Work - Fullstack React + Node.js + SQLite

Projeto completo com:

- Frontend em React + JavaScript + Vite
- Backend em Node.js + Express
- Banco SQLite
- Cadastro com email e senha
- Login com JWT
- Senha criptografada com bcryptjs
- Rota protegida `/api/auth/me`
- Tela inicial com a proposta do To Work: clientes contratam serviços e prestadores oferecem serviços

## Estrutura

```text
backend/   API Node.js + SQLite
frontend/  Aplicação React
```

## Como rodar o backend

Entre na pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` baseado no exemplo:

```bash
copy .env.example .env
```

No Linux/Mac:

```bash
cp .env.example .env
```

Rode a API:

```bash
npm run dev
```

A API vai rodar em:

```text
http://localhost:3001
```

Teste no navegador:

```text
http://localhost:3001/api/health
```

## Como rodar o frontend

Abra outro terminal e entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` baseado no exemplo:

```bash
copy .env.example .env
```

No Linux/Mac:

```bash
cp .env.example .env
```

Rode o React:

```bash
npm run dev
```

O front vai rodar em:

```text
http://localhost:5173
```

## Rotas principais da API

### Cadastro

```http
POST /api/auth/register
```

Body:

```json
{
  "fullName": "Fabio Vinicios",
  "email": "fabio@email.com",
  "password": "123456",
  "accountType": "PRESTADOR"
}
```

`accountType` aceita:

```text
CLIENTE
PRESTADOR
```

### Login

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "fabio@email.com",
  "password": "123456"
}
```

### Perfil logado

```http
GET /api/auth/me
```

Header:

```http
Authorization: Bearer SEU_TOKEN_AQUI
```

## Banco de dados

O SQLite fica em:

```text
backend/data/to_work.sqlite
```

Mesmo que você apague o arquivo, a API cria as tabelas novamente quando iniciar.

## Tabelas criadas

- users
- categories
- provider_profiles
- provider_categories

## Próximos módulos recomendados

Depois desse login/cadastro, os próximos passos seriam:

- Perfil completo do prestador
- Cadastro de serviços
- Busca de prestadores por categoria
- Solicitação de orçamento
- Avaliações
- Upload de foto/avatar
"# To-work" 
