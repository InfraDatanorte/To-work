# Validação da revisão de 30/10/2026

Este relatório registra os cenários verificados na versão local do To Work, os resultados obtidos e os limites da validação.

## Resultado

A revisão visual posterior renovou a página inicial, navegação, categorias, cartões profissionais, formulários de acesso, perfil público e painel. O build e os quatro testes de navegador foram executados novamente, preservando o fluxo completo. A adaptação visual foi conferida em larguras de 320, 390, 768 e 1366 pixels. As novas capturas estão em `evidencias/novo-visual-desktop.png`, `novo-visual-completo.png`, `novo-visual-celular.png` e `novo-painel-desktop.png`.

| Verificação | Resultado |
| --- | --- |
| API: executor nativo do Node.js | 8 testes aprovados |
| Interface: Playwright / Chromium | 4 testes aprovados |
| Build do Vite | Concluído |
| npm audit: raiz, backend e frontend | Nenhuma vulnerabilidade conhecida na consulta realizada |
| Migração em cópia consistente do banco local | Registros existentes preservados, integridade `ok`, sem erros de chaves estrangeiras |
| PDF e DOCX | 41 páginas, sumário atualizado, 15 figuras e 11 quadros |
| Requisitos consolidados | 25 funcionais e 12 não funcionais |
| Apêndices | Execução e demonstração; relação completa das 152 categorias padrão |

## O que foi verificado

- Cadastro com dados válidos e inválidos, duplicação de email, hash de senha, login e expiração de token.
- Bloqueio de conta inativa e proteção do painel.
- Categorias antigas, vínculo e status, inclusão automática de perfil antigo e criação de categoria.
- Edição de perfil, busca sem acentos e combinação com cidade/categoria.
- Exclusão de email de login e telefone da resposta pública.
- Ciclo completo de solicitação, orçamento, aceite, conclusão e avaliação.
- Cancelamento e recusa; bloqueio de transições fora da sequência.
- Bloqueio de pedidos e avaliações de terceiros, e de avaliação antecipada ou duplicada.
- Duas decisões concorrentes, com somente uma alteração efetivada.
- Rollback de uma operação composta após erro.
- Mensagem de rede indisponível e recuperação da pesquisa.
- Busca sem resultado, limpeza dos filtros, endereço inexistente e largura de celular sem rolagem horizontal.
- Persistência após recarregar a página e entrar novamente.

## Isolamento

Os testes de API criam bancos em diretórios temporários e usam portas atribuídas pelo sistema. O navegador usa exclusivamente as portas 3107 (API) e 5187 (interface), banco temporário e usuários fictícios. Os relatórios não incluem credenciais locais.

O script `backend/scripts/checkMigration.js` abre o banco existente somente para leitura, cria uma cópia consistente pelo mecanismo de backup do SQLite e executa a atualização nessa cópia. Na ampliação do catálogo, a cópia passou de 7 para 153 categorias, preservando os registros das 7 categorias anteriores, 6 usuários, 6 perfis e 12 vínculos. Os valores de todos os campos anteriores foram comparados; apenas contagens são publicadas no relatório. Após essa conferência, o catálogo foi aplicado ao banco local com backup prévio; repetir a inicialização manteve 153 categorias, sem duplicar registros.

O catálogo padrão tem 152 categorias em 12 grupos, e a base local mantém também uma categoria anterior personalizada. Os testes verificam o catálogo, a repetição da inicialização, o agrupamento da lista, a busca por nomes de profissões e o vínculo de múltiplas áreas no painel. A seleção `jardineiro` → `Jardinagem` foi exercitada pelo navegador.

## Evidências

- `evidencias/01-inicio.png` até `08-celular.png`: imagens capturadas durante o teste real da interface.
- `evidencias/09-profissoes.png`: seleção de Jardinagem a partir da pesquisa por jardineiro, na interface atual sem o formulário de criação de categorias.
- `evidencias/benchmark.json`: medição local com 100 prestadores fictícios e 50 amostras sequenciais por rota após aquecimento.
- `evidencias/migracao.json`: comparação da cópia do banco, contagens e integridade.
- `evidencias/validacao-final.json`: comandos e resultado das verificações finais.
- `evidencias/validacao_documentacao.json`: conferência do PDF/DOCX, páginas, figuras, requisitos e presença das 152 categorias no apêndice.
- `evidencias/estrutura_documentacao.json`: estrutura do documento e hashes dos arquivos de código documentados.
- `test-results/browser-results.json`: relatório de uma execução do navegador; pasta temporária ignorada pelo Git.

Para repetir:

```powershell
npm install
npm run setup
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run benchmark --prefix backend
npm audit
npm audit --prefix backend
npm audit --prefix frontend
```

Para conferir novamente o banco local sem modificá-lo:

```powershell
node backend/scripts/checkMigration.js
```

## Limites

As verificações foram feitas no Windows com Node.js 24.16.0 e Chromium. Não houve teste de carga em produção, auditoria externa de segurança, implantação pública, pesquisa com usuários nem teste em todos os navegadores. A medição não compara frameworks ou bancos diferentes. Os resultados não garantem ausência de todos os defeitos.

O sistema não processa pagamentos, não envia email, não possui chat, agenda ou upload de fotos. A conclusão é registrada pelo prestador e não comprova a execução presencial. O logout remove o token do navegador; não revoga uma cópia já emitida. A busca filtra em memória e a lista de pedidos é atualizada manualmente.

A aplicação utiliza critérios selecionados da Google Engineering Practices: simplicidade, nomes claros, regras explícitas, testes de comportamento e documentação atualizada.

A documentação acadêmica descreve a seleção de categorias existentes no painel, a rota legada de criação na API, os grupos mantidos no JSON e os estados reais dos pedidos. O guia de apresentação, os diagramas editáveis e a documentação técnica correspondem à mesma versão da aplicação.
