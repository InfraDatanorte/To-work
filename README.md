# To Work

Projeto acadêmico que conecta clientes e prestadores de serviços. Usa React, Express e SQLite e completa o fluxo de solicitação, orçamento, aceite, conclusão e avaliação. A interface recebeu uma revisão visual com azul-violeta, detalhes em amarelo, categorias com ícones, busca em faixa horizontal e telas consistentes de cadastro, login, perfil e painel.

As cores compartilhadas ficam no início de `frontend/src/styles.css`. Os ícones são SVGs locais no componente `Icon.jsx`, sem instalar outra biblioteca. A estrutura de React e os fluxos do sistema foram mantidos para facilitar o estudo.

O catálogo contém **152 categorias padrão em 12 áreas de atuação**. O prestador pode buscar sua profissão pelo nome (por exemplo, `jardineiro` encontra `Jardinagem`), escolher na lista agrupada e vincular várias áreas ao perfil. As categorias já cadastradas são preservadas. O catálogo editável fica em `backend/src/data/serviceCategories.json` e é complementado automaticamente ao iniciar a API. A página inicial mostra seis destaques; a opção **Ver todas as categorias** abre a lista completa.

## Executar no Windows

Recomendado: **Node.js 24 LTS**, com npm. Abra um terminal nesta pasta (a que contém `backend`, `frontend` e este arquivo):

```powershell
npm install
npm run setup
npm run dev
```

Acesse **http://localhost:5173**. A API responde em **http://localhost:3001/api/health**. `Ctrl+C` encerra os dois processos. As portas precisam estar livres.

Os arquivos `.env` existentes são preservados. Sem `JWT_SECRET`, a API gera uma chave temporária em desenvolvimento: reiniciar encerra as sessões existentes. Para manter sessões entre reinícios, configure uma chave aleatória em `backend/.env` (copie `.env.example` se necessário).

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copie somente o resultado para `JWT_SECRET=...`; não publique a chave. Em produção, o segredo precisa ter pelo menos 32 caracteres. `VITE_API_URL` é público, pois integra o JavaScript do navegador.

| Variável | Local | Valor local |
| --- | --- | --- |
| `PORT` | `backend/.env` | `3001` |
| `FRONTEND_URL` | `backend/.env` | `http://localhost:5173` |
| `DATABASE_FILE` | `backend/.env` | `./data/to_work.sqlite` (relativo a backend) |
| `JWT_SECRET` | `backend/.env` | Chave aleatória pessoal; nunca versionar |
| `VITE_API_URL` | `frontend/.env` | `http://localhost:3001/api` |

## Demonstrar o fluxo completo

1. Crie um **PRESTADOR**, preencha o perfil e vincule uma categoria.
2. Em uma janela anônima, crie um **CLIENTE**. Busque o profissional e abra o perfil.
3. Envie uma solicitação de serviço.
4. No painel do prestador, atualize as solicitações e envie o orçamento.
5. No cliente, atualize e aceite. O telefone profissional passa a aparecer para esse cliente.
6. O prestador atualiza a lista e conclui o serviço.
7. O cliente atualiza, avalia uma única vez e consulta a avaliação no perfil público.

As listas são atualizadas pelo botão **Atualizar solicitações**; não há atualização em tempo real. Duas abas do mesmo navegador compartilham o login, então use janela anônima para a segunda conta.

## Organização

```text
backend/
  schema.sql                 # seis tabelas e relacionamentos
  src/
    app.js                   # configuração e tratamento de erros
    server.js                # inicialização
    database.js              # SQLite, migração aditiva e transações
    config.js                # segredo JWT
    middlewares/             # autenticação
    routes/                  # autenticação, vitrine, perfil e pedidos
    utils/                   # validações e tratamento de rotas async
  test/                      # testes de API, com banco temporário
frontend/src/
  pages/                     # início, cadastro, login, painel e perfil público
  components/                # navegação, perfil profissional e solicitações
  context/AuthContext.jsx    # sessão compartilhada
  api/api.js                 # endereço da API e token
  styles.css                 # identidade visual preservada
tests/                       # testes de navegador
docs/                        # documentação e evidências
```

## Verificar

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run benchmark --prefix backend
```

Validação em 30/10/2026: **8 testes de API e 4 testes de navegador aprovados**, build concluído e auditorias npm sem vulnerabilidades conhecidas nas três pastas. Os testes incluem migração de banco antigo, autenticação, autorização, estados, concorrência, rollback, avaliações, busca, falha de rede e celular. Os bancos dos testes são temporários; o Playwright usa portas **3107 e 5187**. `docs/evidencias` contém capturas com usuários fictícios, medição local e resultado da migração em uma cópia do banco.

Para repetir a auditoria:

```powershell
npm audit
npm audit --prefix backend
npm audit --prefix frontend
```

## API

Rotas protegidas exigem `Authorization: Bearer <token>`.

| Método | Rota | Acesso / função |
| --- | --- | --- |
| GET | `/api/health` | Público; verifica API e consulta ao banco |
| GET | `/api/categories` | Público; categorias |
| GET | `/api/professionals?q=&city=&categoryId=` | Público; busca sem acentos |
| GET | `/api/professionals/:id` | Público; perfil, categorias ativas e avaliações |
| POST | `/api/auth/register` | Cadastro: `fullName`, `email`, `password`, `accountType` |
| POST | `/api/auth/login` | Login: `email`, `password` |
| GET | `/api/auth/me` | Usuário autenticado |
| GET / PUT | `/api/provider/profile` | Prestador; `phone`, `city`, `state`, `description`, `basePrice` |
| POST | `/api/categories` | Prestador; cria e vincula categoria atomicamente |
| GET / POST | `/api/provider/categories` | Prestador; lista ou vincula `categoryId` |
| PATCH | `/api/provider/categories/:id` | Prestador; `status`: `ATIVO` ou `INATIVO` |
| GET | `/api/requests` | Lista somente pedidos do participante |
| POST | `/api/requests` | Cliente; `providerId`, `categoryId`, `title`, `description`, `city` |
| PATCH | `/api/requests/:id` | Participante; muda `status`; orçamento usa `amount` e `message` |
| POST | `/api/requests/:id/review` | Cliente do serviço concluído; `rating` (1 a 5), `comment` |

| Estado atual | Quem | Próximos estados permitidos |
| --- | --- | --- |
| `PENDENTE` | Prestador | `ORCADO`, `RECUSADO` |
| `PENDENTE` | Cliente | `CANCELADO` |
| `ORCADO` | Cliente | `ACEITO`, `RECUSADO`, `CANCELADO` |
| `ACEITO` | Prestador | `CONCLUIDO` |
| `CONCLUIDO`, `RECUSADO`, `CANCELADO` | — | Encerrados; sem nova transição |

O orçamento é armazenado em centavos inteiros. As notas públicas são calculadas das avaliações reais de pedidos concluídos; campos antigos de nota fictícia não são usados para esse cálculo.

## Documentação e apresentação

- `docs/Documentacao_To_Work_Atualizada.docx`: documento editável baseado no modelo institucional.
- `docs/Documentacao_To_Work_Atualizada.pdf`: versão para leitura.
- `docs/GUIA_APRESENTACAO.md`: roteiro, explicações simples e perguntas para a banca.
- `docs/DIAGRAMAS.md`: diagramas em Mermaid, editáveis.
- `docs/DOCUMENTACAO_TECNICA.md`: organização do código, banco, catálogo, permissões e rotas da API.
- `docs/RELATORIO_VALIDACAO.md`: evidências e limites da validação.

## Critérios de qualidade e limites

A [Google Engineering Practices](https://google.github.io/eng-practices/review/reviewer/looking-for.html) orienta os critérios de qualidade: desenho adequado, funcionalidade, simplicidade, nomes claros, testes e documentação.

A aplicação utiliza React, Express e SQLite, com estilos compartilhados e ícones locais. A implementação inclui validação na API, SQL parametrizado, hash bcrypt, JWT com expiração, controle de participantes, transações, bloqueio de decisões concorrentes, limite de tentativas de autenticação e mensagens de erro.

Esta versão acadêmica não integra pagamentos, chat, agenda, upload de fotos, recuperação de senha por email, verificação documental ou moderação. Não há autenticação externa nem confirmação real da execução do serviço fora do registro do prestador. O token fica no `localStorage` e o logout remove a sessão do navegador, sem revogar tokens já emitidos. Para publicação, planeje HTTPS, revisão de segurança/privacidade, backup, monitoramento e avaliação de cookies HttpOnly e revogação. A busca carrega a lista e filtra em memória; paginação e busca no banco são evoluções para bases maiores.

O banco local original e os `.env` não devem ser enviados ao GitHub. A atualização é aditiva: cria as tabelas de pedidos e avaliações e mantém os registros existentes. A cópia original está fora desta pasta em `backup_original_2026-10-30`.
