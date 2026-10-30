# To Work — documentação técnica da versão atual

Versão documentada em 30/10/2026. Este guia complementa o documento acadêmico e explica o código em termos diretos.

## Organização da aplicação

| Parte | Responsabilidade | Arquivos principais |
| --- | --- | --- |
| Interface | Telas, formulários, navegação e sessão do navegador | `frontend/src/pages`, `components`, `context/AuthContext.jsx` |
| API | Receber JSON, validar, autenticar e autorizar ações | `backend/src/app.js`, `routes`, `middlewares` |
| Persistência | Consultas, transações e criação aditiva das tabelas | `backend/src/database.js`, `backend/schema.sql` |
| Catálogo | Categorias padrão, grupos e termos auxiliares | `backend/src/data/serviceCategories.json` |

O React envia requisições pelo Axios. Nas rotas protegidas, o navegador envia `Authorization: Bearer <token>`. O servidor valida o JWT e consulta se a conta continua ativa. O banco é um arquivo SQLite local.

## Contas e permissões

Existem duas opções de conta: `CLIENTE` e `PRESTADOR`. O cadastro do prestador cria automaticamente seu perfil profissional na mesma transação do usuário. O cadastro não vincula categorias automaticamente.

O visitante pesquisa profissionais e consulta perfis. O cliente solicita serviços, decide sobre o orçamento e avalia um pedido concluído. O prestador edita seu perfil, vincula categorias existentes, responde aos pedidos e registra a conclusão. Os dois participantes podem consultar somente os próprios pedidos.

O tipo de conta é definido no cadastro; a aplicação não disponibiliza uma tela para trocá-lo depois.

## Catálogo de profissões

O JSON define **152 categorias padrão em 12 grupos**. A inicialização percorre o catálogo em uma transação e usa `INSERT OR IGNORE`, preservando categorias e descrições anteriores.

O SQLite guarda `id`, `name`, `description` e `created_at` de cada categoria. `group` e `keywords` são acrescentados pela API a partir do JSON. Categorias anteriores fora do catálogo recebem o grupo `Outros serviços`. Assim, uma base existente pode conter mais de 152 registros.

O painel pesquisa nome, descrição, grupo e termos auxiliares sem distinguir acentos. Por exemplo, `jardineiro` encontra `Jardinagem`. A lista disponível exclui categorias já vinculadas ao prestador. O vínculo é individual, mas pode ser repetido para quantas categorias forem necessárias. Ativar e desativar controla quais categorias aparecem publicamente e podem receber novas solicitações.

A Home mostra seis destaques: Elétrica, Hidráulica, Informática, Jardinagem, Limpeza e Pintura. O filtro de categoria contém a lista completa agrupada. A busca textual pública também considera os termos associados às categorias ativas do profissional.

O formulário **Cadastrar nova categoria** foi retirado da interface. O endpoint `POST /api/categories` permanece no servidor por compatibilidade e exige uma conta de prestador; seu comportamento não representa um formulário disponível no painel atual.

## Banco de dados

| Tabela | Finalidade | Relações e restrições |
| --- | --- | --- |
| `users` | Nome, email, hash da senha, tipo, atividade e datas | Email único; tipo cliente ou prestador |
| `provider_profiles` | Telefone, cidade, UF, descrição, preço inicial e campos legados | Um perfil por usuário prestador |
| `categories` | Nome e descrição da área de serviço | Nome único |
| `provider_categories` | Associação entre perfil e categoria | Par único; status `ATIVO` ou `INATIVO` |
| `service_requests` | Cliente, prestador, categoria, necessidade, situação e orçamento | Chaves estrangeiras; valor orçado positivo em centavos |
| `reviews` | Nota e comentário de um serviço | Uma por pedido; nota inteira entre 1 e 5 |

O schema completo está em `backend/schema.sql`. O arquivo `database.js` também trata a atualização de bancos antigos: acrescenta o status aos vínculos quando necessário e cria perfis ausentes para prestadores antigos.

Os campos legados `rating`, `reviews_count` e `verified` permanecem em `provider_profiles`, preservando a base antiga. A avaliação pública atual usa consultas à tabela `reviews`; o site não apresenta verificação documental baseada nesses campos legados.

O pedido armazena a situação atual e as datas de criação e atualização. Não existe tabela de histórico de mudanças de estado.

## Rotas públicas e autenticação

| Método e rota | Entrada | Resultado |
| --- | --- | --- |
| `GET /api/health` | — | Verifica a API e uma consulta ao banco |
| `GET /api/categories` | — | Categorias com grupo e termos auxiliares |
| `GET /api/professionals` | Filtros opcionais `q`, `city`, `categoryId` | Profissionais ativos e categorias ativas |
| `GET /api/professionals/:id` | ID válido | Perfil, categorias ativas e avaliações |
| `POST /api/auth/register` | `fullName`, `email`, `password`, `accountType` | Usuário e token; HTTP 201 |
| `POST /api/auth/login` | `email`, `password` | Usuário e token |
| `GET /api/auth/me` | Token | Sessão atual |

Cadastro aceita nome de 2 a 100 caracteres, email válido com até 254 caracteres e senha de pelo menos 6 caracteres e no máximo 72 bytes. O email é normalizado para minúsculas. O hash bcrypt usa custo 10. O JWT utiliza HS256 e expira em sete dias.

## Rotas do prestador

| Método e rota | Entrada / comportamento |
| --- | --- |
| `GET /api/provider/profile` | Dados editáveis do próprio perfil |
| `PUT /api/provider/profile` | `phone`, `city`, `state`, `description`, `basePrice` |
| `GET /api/provider/categories` | Lista dos próprios vínculos |
| `POST /api/provider/categories` | `categoryId`; cria ou reativa o vínculo |
| `PATCH /api/provider/categories/:id` | `status`: `ATIVO` ou `INATIVO` |
| `POST /api/categories` | Rota legada: `name` e `description`; cria categoria e vínculo em uma transação |

O perfil exige cidade, UF brasileira e descrição. O telefone é opcional. O preço inicial pode ser nulo; quando informado, precisa ser positivo, ter até duas casas decimais e não ultrapassar R$ 1.000.000,00. Esse preço é uma referência pública e não substitui o orçamento específico.

## Solicitações e avaliações

| Método e rota | Entrada / comportamento |
| --- | --- |
| `GET /api/requests` | Lista somente pedidos do usuário participante |
| `POST /api/requests` | Cliente envia `providerId`, `categoryId`, `title`, `description`, `city` |
| `PATCH /api/requests/:id` | Participante envia `status`; orçamento inclui `amount` e `message` |
| `POST /api/requests/:id/review` | Cliente do pedido concluído envia `rating` e `comment` |

Uma solicitação precisa usar uma categoria ativa de um prestador ativo. O título aceita até 100 caracteres, a descrição até 1.500 e a cidade até 100. O orçamento deve ser positivo, com até duas casas decimais e valor máximo de R$ 1.000.000,00; sua mensagem aceita até 1.000 caracteres. O servidor converte o orçamento para centavos inteiros.

| Situação atual | Quem decide | Próximas situações |
| --- | --- | --- |
| `PENDENTE` | Prestador | `ORCADO`, `RECUSADO` |
| `PENDENTE` | Cliente | `CANCELADO` |
| `ORCADO` | Cliente | `ACEITO`, `RECUSADO`, `CANCELADO` |
| `ACEITO` | Prestador | `CONCLUIDO` |
| `CONCLUIDO`, `RECUSADO`, `CANCELADO` | — | Sem nova transição |

O UPDATE inclui a situação anterior no WHERE. Se outra requisição já tomou uma decisão, a API retorna conflito. O telefone do prestador é enviado ao cliente nos pedidos aceitos ou concluídos e não aparece nas rotas públicas.

A avaliação exige nota inteira de 1 a 5 e comentário opcional de até 500 caracteres. A API verifica se o usuário é o cliente e se o pedido foi concluído. A restrição única de `request_id` impede uma segunda avaliação.

## Respostas e tratamento de erros

| Código | Significado habitual |
| --- | --- |
| 200 / 201 | Operação concluída / registro criado |
| 400 | Dados inválidos ou JSON malformado |
| 401 | Token ausente/inválido ou credenciais incorretas |
| 403 | Tipo de conta sem permissão para a função |
| 404 | Recurso inexistente ou pedido de outro participante |
| 409 | Duplicação, mudança de situação inválida ou conflito concorrente |
| 413 | JSON excede o limite de 32 kB |
| 429 | Mais de 50 tentativas de cadastro/login por IP em 15 minutos |
| 500 | Erro interno tratado pela API |

O limitador funciona em memória e considera cadastro e login conjuntamente. A versão não compartilha esse contador entre várias instâncias.

## Execução, verificação e limites

Na raiz do projeto: `npm install`, `npm run setup` e `npm run dev`. A interface usa a porta 5173 e a API usa a 3001 por padrão. Os arquivos `.env.example` descrevem as configurações.

Use `npm test`, `npm run build` e `npm run test:e2e` para repetir os cenários. O navegador exige antes `npx playwright install chromium`. As bases dos testes são temporárias; as portas de navegador são 3107 e 5187.

O token fica no localStorage. Logout remove a cópia do navegador e não revoga tokens já emitidos. A verificação de conta ativa continua ocorrendo na API. Sem segredo configurado, o desenvolvimento gera uma chave temporária. Em produção, `JWT_SECRET` precisa ter pelo menos 32 caracteres.

A atualização das solicitações é manual. Não há pagamentos, chat, agenda, upload de fotos, moderação, confirmação de conclusão pelo cliente, verificação documental ou recuperação de senha por email. A busca filtra em memória; a versão não pagina resultados. As limitações e próximas melhorias estão descritas no documento acadêmico.
