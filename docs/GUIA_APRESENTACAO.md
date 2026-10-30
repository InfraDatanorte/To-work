# Como explicar e demonstrar o To Work

O To Work aproxima quem precisa de um serviço de quem oferece esse serviço. O cliente encontra um profissional, solicita atendimento, recebe um orçamento e decide se aceita. O prestador registra a conclusão e o cliente pode avaliar.

## Explicação em dois minutos

“Eu mantive a aplicação dividida em três partes. O React monta as telas no navegador. O Express recebe as requisições e aplica as regras. O SQLite guarda os dados em um arquivo. A comunicação acontece por HTTP com dados em JSON.

Existem dois tipos de conta: cliente e prestador. A senha é armazenada como hash, usando bcrypt. Após o login, a API gera um token JWT. O navegador envia esse token nas ações protegidas e a API confere quem é o usuário.

O pedido passa por situações definidas: pendente, orçado, aceito e concluído. A API verifica o dono do pedido e a situação atual antes de aceitar uma mudança. Só o cliente daquele serviço pode avaliá-lo, depois da conclusão, e uma única vez.”

## Preparar a demonstração

Use Node.js 24 LTS. Na pasta que contém `package.json`, `backend` e `frontend`:

```powershell
npm install
npm run setup
npm run dev
```

Abra http://localhost:5173. Use uma janela normal para o prestador e uma janela anônima para o cliente. Duas abas da mesma sessão compartilham o login.

1. Cadastre uma conta **PRESTADOR**. No painel, preencha cidade, UF, descrição e telefone; salve o perfil.
2. Em **Com o que você trabalha?**, pesquise uma profissão e vincule a categoria **Elétrica**. A lista contém 152 categorias padrão agrupadas em 12 áreas; você pode vincular mais de uma ao perfil. Por exemplo, `jardineiro` encontra **Jardinagem**.
3. Na janela anônima, cadastre uma conta **CLIENTE**.
4. Abra a página inicial, busque por `eletrica` e pela cidade, e abra o perfil do profissional.
5. Envie uma solicitação com título, descrição e cidade.
6. No painel do prestador, clique em **Atualizar solicitações**, informe o valor e envie o orçamento.
7. No painel do cliente, atualize a lista e aceite o orçamento. O telefone do prestador passa a aparecer.
8. No painel do prestador, atualize e clique em **Concluir serviço**.
9. No painel do cliente, atualize, escolha uma nota e envie a avaliação.
10. Abra o perfil público e mostre a avaliação. Recarregue a página para demonstrar a persistência.

## Arquivos para estudar

| Arquivo | O que explicar |
| --- | --- |
| `frontend/src/App.jsx` | Qual endereço abre cada página. |
| `frontend/src/context/AuthContext.jsx` | Compartilha o usuário logado, login e logout. |
| `frontend/src/api/api.js` | Centraliza o endereço da API e envia o token. |
| `backend/src/routes/authRoutes.js` | Cadastro, hash da senha, login e JWT. |
| `backend/src/middlewares/authMiddleware.js` | Confere token e conta ativa. |
| `backend/src/routes/requestRoutes.js` | Regras dos pedidos e avaliações. |
| `backend/src/database.js` | Consultas parametrizadas, inicialização e transações. |
| `backend/schema.sql` | Estrutura das seis tabelas. |
| `backend/src/data/serviceCategories.json` | Catálogo padrão das 152 categorias nos 12 grupos. |
| `frontend/src/components/CategoryOptions.jsx` | Monta a lista de categorias separada por áreas. |

## Perguntas que a banca pode fazer

**Por que SQLite?** Dispensa instalar outro servidor e atende à demonstração local. Para muitos acessos simultâneos, seria necessário medir a carga e avaliar outro banco.

**O que é API?** É a interface usada pelas telas para pedir dados e executar ações no servidor. Exemplo: `POST /api/requests` cria uma solicitação.

**O que é hash?** Uma transformação da senha usada para verificá-la no login. Não guardamos a senha em texto e não recuperamos a senha original a partir do hash.

**JWT protege tudo sozinho?** Não. Ele identifica a sessão. A API também precisa verificar se o usuário tem permissão para agir naquele pedido.

**Por que existe provider_categories?** Um profissional pode atender várias categorias e uma categoria pode ter vários profissionais. Essa tabela faz a ligação muitos para muitos.

**O grupo de profissões é uma tabela?** Não. A lista padrão e seus grupos estão no JSON. As categorias e seus vínculos ficam no SQLite, e a API junta as informações para apresentar a lista agrupada. O banco continua com seis tabelas.

**Por que a base pode mostrar 153 categorias se o padrão tem 152?** As categorias antigas são preservadas. Uma categoria personalizada anterior pode continuar no banco além das 152 categorias padrão.

**O prestador cria categorias?** O painel oferece a escolha das categorias existentes. O formulário de criação foi retirado. Uma rota de criação permanece na API por compatibilidade, mas não é uma ação apresentada no painel atual.

**O que é transação?** Um conjunto de alterações que deve acontecer inteiro. No cadastro de prestador, usuário e perfil são gravados juntos; se uma etapa falhar, tudo é desfeito.

**Por que guardar centavos?** O orçamento usa um número inteiro, como 15050 para R$ 150,50, evitando cálculos com frações no valor contratado.

**O cliente pode alterar o pedido de outra pessoa?** Não. O servidor verifica os participantes; testes tentam fazer isso e esperam bloqueio.

**Qual referência orienta os critérios de qualidade?** Google Engineering Practices: simplicidade, nomes claros, regras explícitas, testes de comportamentos e documentação atualizada.

**Tem pagamento ou chat?** Esta versão registra o orçamento e o acompanhamento. Pagamentos, chat, fotos e agenda são evoluções futuras.

**O que os testes provam?** Os cenários executados passaram: 8 testes da API e 4 do navegador. Isso não prova ausência de todos os defeitos nem substitui testes de carga ou auditoria de produção.

## Comandos de conferência

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run benchmark --prefix backend
```

Os testes usam bancos temporários e portas separadas. As capturas de `docs/evidencias` mostram somente contas fictícias.
