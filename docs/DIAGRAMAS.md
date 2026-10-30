# Diagramas do To Work

Representam o comportamento implementado em 30/10/2026.

## Arquitetura

```mermaid
flowchart LR
    U[Cliente ou prestador] --> R[React: telas e estado]
    R -->|HTTP / JSON + JWT| E[Express: rotas e regras]
    E -->|SQL parametrizado| S[(SQLite: arquivo local)]
    C[serviceCategories.json: catálogo e grupos] --> E
    S --> E
    E --> R
```

## Seleção de profissões

```mermaid
flowchart TD
    C[Catálogo padrão: 152 categorias e 12 grupos] --> I[Inicialização insere somente categorias ausentes]
    I --> B[(SQLite: categorias e vínculos)]
    B --> A[API retorna categorias]
    C --> M[API acrescenta grupos e termos de pesquisa]
    A --> M
    M --> P[Prestador pesquisa profissão: jardineiro]
    P --> S[Escolhe Jardinagem e vincula ao perfil]
    S --> V[Vínculo ATIVO]
    V --> PU[Categoria aparece no perfil público]
    PU --> SO[Cliente pode solicitar esse serviço]
    V --> D[Prestador pode desativar e reativar o vínculo]
```

Os grupos e termos auxiliares são metadados do arquivo JSON; não constituem uma nova tabela no DER. O formulário para criar categorias foi removido do painel. A rota legada da API continua no código por compatibilidade, e não aparece como ação oferecida pela interface.

## Casos de uso

```mermaid
flowchart LR
    V[Visitante] --> C((Cadastrar conta))
    V --> L((Fazer login))
    V --> B((Buscar e consultar perfis))
    CL[Cliente] --> B
    CL --> SO((Solicitar serviço))
    CL --> AO((Aceitar / recusar orçamento))
    CL --> CA((Cancelar pedido pendente ou orçado))
    CL --> AV((Avaliar serviço concluído))
    P[Prestador] --> EP((Editar perfil e categorias))
    P --> EO((Enviar orçamento / recusar pedido))
    P --> CO((Concluir serviço aceito))
    CL --> H((Consultar seus pedidos e sair))
    P --> H
```

## Cadastro e acesso

```mermaid
flowchart TD
    A[Formulário] --> V{Dados válidos?}
    V -->|Não| ER[Exibir erro]
    V -->|Sim| B[Hash bcrypt da senha]
    B --> T[Transação: usuário + perfil se prestador]
    T --> J[Emitir JWT e salvar sessão]
    J --> D[Dashboard]
    X[Acesso protegido] --> Y{Token válido e conta ativa?}
    Y -->|Não| L[Login]
    Y -->|Sim| D
```

## Estados do serviço

```mermaid
stateDiagram-v2
    [*] --> PENDENTE: cliente solicita
    PENDENTE --> ORCADO: prestador envia valor
    PENDENTE --> RECUSADO: prestador recusa
    PENDENTE --> CANCELADO: cliente cancela
    ORCADO --> ACEITO: cliente aceita
    ORCADO --> RECUSADO: cliente recusa
    ORCADO --> CANCELADO: cliente cancela
    ACEITO --> CONCLUIDO: prestador conclui
    CONCLUIDO --> [*]: cliente pode avaliar uma vez
    RECUSADO --> [*]
    CANCELADO --> [*]
```

## Entidades e relacionamentos

```mermaid
erDiagram
    users ||--o| provider_profiles : "possui se prestador"
    users ||--o{ service_requests : "solicita se cliente"
    provider_profiles ||--o{ provider_categories : "oferece"
    categories ||--o{ provider_categories : "classifica"
    provider_profiles ||--o{ service_requests : "recebe"
    categories ||--o{ service_requests : "identifica serviço"
    service_requests ||--o| reviews : "recebe após conclusão"
    users {
      integer id PK
      text full_name
      text email UK
      text password_hash
      text account_type
      integer active
    }
    provider_profiles {
      integer id PK
      integer user_id FK,UK
      text phone
      text city
      text state
      text description
      real base_price
    }
    categories {
      integer id PK
      text name UK
      text description
    }
    provider_categories {
      integer id PK
      integer provider_id FK
      integer category_id FK
      text status
    }
    service_requests {
      integer id PK
      integer client_id FK
      integer provider_id FK
      integer category_id FK
      text title
      text description
      text city
      text status
      integer quote_cents
      text quote_message
    }
    reviews {
      integer id PK
      integer request_id FK,UK
      integer rating
      text comment
    }
```

Campos de data foram omitidos deste desenho resumido; o schema completo está em `backend/schema.sql`. As colunas legadas `rating`, `reviews_count` e `verified` de `provider_profiles` permanecem para preservar o banco antigo, mas não representam validação documental nem alimentam a avaliação pública atual.
