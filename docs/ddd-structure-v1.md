# Domain structure

## Arquitetura

### Fase 1: Modular Monolith (Atual)

- **Modular Monolith:** uma aplicação NestJS, Bounded Contexts isolados por pasta (`src/modules/account`, `src/modules/payment`).
- **Clean Architecture + DDD:** domínio no centro; casos de uso na application; HTTP/persistência/mensageria na infrastructure.
- **Kernel compartilhado:** `src/core` (`Entity`, `AggregateRoot`, `UniqueEntityID`, `Either`, `Money`, eventos de domínio).
- **Erros:** validação estrita no domínio (throw); `Either<Error, Result>` nos Use Cases.
- **Preparação para microsserviços:** Bounded Contexts estritamente isolados, comunicação via eventos e interfaces (não acoplamento direto).

### Fase 2: Arquitetura de Microsserviços (Roadmap)

#### Visão Geral da Arquitetura Alvo

```
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                          │
│              (Autenticação, Rate Limiting, CORS)            │
└────────────────────┬────────────────────┬───────────────────┘
                     │                    │
         ┌───────────▼──────────┐  ┌─────▼──────────────┐
         │  Account Service     │  │  Payment Service   │
         │  (Port 3001)         │  │  (Port 3002)       │
         │                      │  │                    │
         │  - DigitalAccount    │  │  - Expense         │
         │  - Member            │  │  - Approval        │
         │  - Balance Mgmt      │  │  - Payment Workflow│
         └──────┬───────────────┘  └────────┬───────────┘
                │                           │
         ┌──────▼──────────┐         ┌─────▼────────────┐
         │  PostgreSQL     │         │  PostgreSQL      │
         │  (account_db)   │         │  (payment_db)    │
         └─────────────────┘         └──────────────────┘
                │                           │
                └────────┬──────────────────┘
                         │
                  ┌──────▼────────┐
                  │   RabbitMQ    │
                  │  (Eventos)    │
                  └───────────────┘
                         │
                  ┌──────▼────────┐
                  │  Temporal.io  │
                  │    (Sagas)    │
                  └───────────────┘
                         │
                  ┌──────▼────────┐
                  │      SCD      │
                  │  (Gateway)    │
                  └───────────────┘
```

#### Princípios da Arquitetura de Microsserviços

1. **Database per Service**
   - Cada serviço tem seu próprio banco de dados
   - Account Service: `account_db` (tables: accounts, members)
   - Payment Service: `payment_db` (tables: expenses, approvals)
   - **Sem joins entre bancos**; comunicação via APIs ou eventos

2. **Comunicação Síncrona (REST APIs)**
   - Payment Service → Account Service: operações de saldo (reserve, release, debit)
   - Padrões de resiliência: Circuit Breaker, Retry, Timeout
   - Versionamento de APIs: `/api/v1/`, `/api/v2/`

3. **Comunicação Assíncrona (Event-Driven)**
   - RabbitMQ como message broker
   - Account publica: `account.balance.reserved`, `account.balance.debited`, `account.status.changed`
   - Payment consome eventos de Account para atualizar cache local
   - **Eventual Consistency** entre serviços

4. **Sagas Distribuídas (Temporal.io)**
   - Workflow: SchedulePayment coordena Account + Payment + SCD
   - Compensating transactions em caso de falha
   - Garantia de consistência em operações de longa duração

5. **Shared Kernel (Mínimo)**
   - `src/core` (Entity, AggregateRoot, UniqueEntityID, Either, Money, DomainEvents)
   - Copiado para cada serviço (não é biblioteca compartilhada para evitar acoplamento)
   - Versionamento independente por serviço

6. **API Gateway**
   - Ponto único de entrada para clientes externos
   - Roteamento: `/api/v1/accounts/*` → Account Service, `/api/v1/expenses/*` → Payment Service
   - Cross-cutting concerns: autenticação, logging, rate limiting

7. **Service Discovery (Produção)**
   - Consul, Eureka, ou Kubernetes DNS
   - Health checks: `/health`, `/readiness`, `/liveness`

8. **Observabilidade Distribuída**
   - **Tracing:** OpenTelemetry + Jaeger (rastrear requests entre serviços)
   - **Métricas:** Prometheus + Grafana (RED metrics: Rate, Errors, Duration)
   - **Logging:** ELK Stack ou Loki (correlação via Request ID)

#### Estratégia de Migração: Strangler Fig Pattern

**Por que Strangler Fig?**
- Migração **incremental** (não big bang)
- Reduz risco de downtime
- Permite validar cada serviço antes de desligar o monólito

**Etapas:**
1. **Garantir isolamento de BCs no monólito** (Fase 1)
2. **Criar Account Service** (extrai `modules/account`)
3. **API Gateway roteia `/accounts` para Account Service**
4. **Monólito delega chamadas para Account Service** (proxy temporário)
5. **Criar Payment Service** (extrai `modules/payment`)
6. **API Gateway roteia `/expenses` para Payment Service**
7. **Remover código extraído do monólito**
8. **Desligar monólito quando todos os BCs foram extraídos**

#### Trade-offs: Monólito vs Microsserviços

| Aspecto | Modular Monolith (Fase 1) | Microsserviços (Fase 2) |
|---------|---------------------------|-------------------------|
| **Complexidade** | Baixa | Alta (rede, distribuição) |
| **Deploy** | Um deploy | Deploy independente por serviço |
| **Consistência** | ACID (transações locais) | Eventual Consistency |
| **Performance** | Rápida (in-process) | Latência de rede entre serviços |
| **Escalabilidade** | Vertical | Horizontal (por serviço) |
| **Resiliência** | Falha afeta tudo | Falha isolada por serviço |
| **Desenvolvimento** | Time pequeno | Times independentes por serviço |
| **Observabilidade** | Simples | Complexa (tracing distribuído) |

**Conclusão:** Para projeto pequeno, Modular Monolith é mais eficiente. Microsserviços são válidos para **demonstrar conhecimento** (PDI) ou quando houver necessidade real de escala/times independentes.

## Bounded Contexts

### Account
- DigitalAccount (AR), Member (E)
- VOs: AccountHolder, BankIdentity
- Enum: AccountStatus (`src/modules/account/domain/enums`)
- Money vive em `src/core/value-objects` (kernel compartilhado, valor interno em centavos)

### Payment
- Expense (AR)
- VOs: Payee, PaymentDetails, Approval
- Money (core)

`ExpenseApproval` existe no código, mas **não é usado** pelo agregado Expense. A alçada está no VO `Approval`.

## Aggregates (como está implementado)

- DigitalAccount (AR)
    - id: UniqueEntityID
    - holder (VO) AccountHolder[cnpj, legalName, tradeName]
    - status (enum) AccountStatus[PENDING, VALIDATED, ACTIVE, BLOCKED, CLOSED]
    - bankIdentity (VO) BankIdentity[externalAccountId, bankCode, branch, accountNumber]
    - balance: Money (VO, core)
    - reservedBalance: Money (VO, core)
    - members (E[]) Member[id, personId, role, status, createdAt]
      - role: ADMIN | COLLABORATOR
      - status: ACTIVE | INACTIVE
      - admin ativo é aprovador; colaborador não é
    - createdAt: Date
    - updatedAt?: Date | null
    - métodos: `reserveBalance`, `releaseReservedBalance`, `confirmDebit`, `changeStatus`

- Expense (AR)
    - id: UniqueEntityID
    - accountId: string (ainda não é UniqueEntityID)
    - payee (VO) Payee[name, taxId, taxIdType CPF|CNPJ, email?]
    - amount (VO) Money
    - paymentDetails (VO) discriminated union
      - PIX[pixKey, pixKeyType]
      - BOLETO[barCode]
      - BANK_TRANSFER[bankCode, branch, accountNumber, accountType]
      - `method` sai de PaymentDetails (não existe VO PaymentMethod separado)
    - approval (VO) Approval[requiredApprovalsCount, decisions[]]
      - WorkflowStatus: PENDING | APPROVED | REJECTED
      - Decision: approverPersonId, status APPROVED|REJECTED, rejectionReason?, createdAt
    - status: DRAFT | PAID | CANCELLED
    - dueDate: Date
    - paidAt?: Date | null
    - createdAt: Date
    - métodos: `approve`, `reject`, `markAsPaid`, `cancel`

# Legends

AR -> aggregate root
E -> entity
VO -> value object


## RF
### A API deve permitir:
- 01 - Criar uma nova conta digital com aprovadores (PF)
- 02 - Alterar status da conta digital (Ativar | Bloquear | Encerrar)
- 03 - Criar uma despesa (status inicial de aprovação PENDING; ciclo de pagamento ainda a evoluir)
- 04 - Aprovar ou Rejeitar uma despesa (Altera workflow de Approval)
- 05 - Agendar/Enviar uma despesa para pagamento (Bloqueia saldo na DigitalAccount e altera status de pagamento para SCHEDULED)
- 06 - Processar liquidação de despesa (Debita o saldo reservado e marca como PAID com o retorno da SCD)
- 07 - Estornar ou Cancelar uma despesa (Devolve saldo reservado/debitado e marca como REFUNDED ou CANCELLED)

RF 05–07 ainda **não** estão no agregado Expense (não há SCHEDULED / IN_PROCESSING / FAILED / REFUNDED, nem `schedule` / `refund`).

---

## 💡 Observações e Sugestões de Arquitetura

### ✅ Pontos Fortes da Implementação Atual

1. **Value Objects bem desenhados:** Money, AccountHolder, BankIdentity, Payee, PaymentDetails seguem princípios de imutabilidade e encapsulamento.
2. **Agregados com invariantes claras:** DigitalAccount protege integridade de saldo; Expense protege fluxo de aprovação.
3. **Separação de responsabilidades:** Bounded Contexts estão isolados corretamente (Payment não importa domínio de Account).
4. **Either para Use Cases:** Preparado para tratamento funcional de erros na camada de aplicação.
5. **Testes co-locados:** Alguns testes já seguem padrão correto (`expense.spec.ts`, `money.spec.ts`, `approval.spec.ts`).

### ⚠️ Inconsistências a Resolver

#### 1. **ExpenseApproval (entidade órfã)**
   - **Status:** Definida em `src/modules/payment/domain/entities/expense-approval.ts` mas não utilizada.
   - **Conflito:** O AR Expense usa o VO `Approval` para gerenciar alçadas.
   - **Decisão necessária:**
     - **Opção A:** Remover `ExpenseApproval` se não for necessária.
     - **Opção B:** Substituir o VO `Approval` por `ExpenseApproval` como entidade, se múltiplos níveis de alçada forem exigidos.
   - **Recomendação de mercado:** Para sistemas de alçada simples (contagem de aprovações), o VO é suficiente. Para workflows complexos (alçadas hierárquicas, múltiplos níveis), uma entidade é mais apropriada.

#### 2. **accountId em Expense como string**
   - **Status:** Deveria ser `UniqueEntityID` para manter consistência de tipos.
   - **Impacto:** Fragilidade de tipo, dificulta refatoração futura.
   - **Prioridade:** Alta.

#### 3. **Ciclo de pagamento incompleto (RF 05–07)**
   - **Status:** Expense tem apenas `DRAFT | PAID | CANCELLED`.
   - **Necessário:** `SCHEDULED`, `IN_PROCESSING`, `FAILED`, `REFUNDED` + métodos correspondentes.
   - **Alinhamento com mercado:** Sistemas de pagamento reais precisam de estados intermediários para rastrear processamento assíncrono.

#### 4. **Domain Events não emitidos**
   - **Status:** Infraestrutura existe, mas ARs não emitem eventos nos métodos de mutação.
   - **Impacto:** Integração entre contextos fica bloqueada; não há auditoria de mudanças de estado.
   - **Recomendação:** Emitir eventos em todos os pontos de mutação críticos:
     - `DigitalAccount`: `BalanceReserved`, `BalanceDebited`, `BalanceReleased`, `AccountStatusChanged`
     - `Expense`: `ExpenseApproved`, `ExpenseRejected`, `ExpenseScheduled`, `ExpensePaid`, `ExpenseFailed`, `ExpenseCancelled`, `ExpenseRefunded`

### 🏗️ Sugestões de Evolução Arquitetural

#### 1. **Application Services Layer (não implementada)**
   - **O que é:** Camada que orquestra Use Cases e coordena operações entre contextos.
   - **Exemplo:** `AccountBalanceService` expõe métodos `reserve()`, `release()`, `debit()` para Payment.
   - **Benefício:** Payment não acessa diretamente repositórios de Account; reduz acoplamento.
   - **Padrão de mercado:** Hexagonal Architecture (Ports & Adapters).

#### 2. **Validação de CNPJ no AccountHolder**
   - **Status:** Não implementada.
   - **Recomendação:** Validar formato e dígitos verificadores (algoritmo oficial).
   - **Ferramenta:** Biblioteca `@fnando/cnpj` ou implementação própria.

#### 3. **Payee - Validação de PIX Key**
   - **Status:** Não valida formato de chaves PIX (CPF, CNPJ, email, telefone, chave aleatória).
   - **Recomendação:** Adicionar validação específica por tipo de chave PIX no VO `PaymentDetails` (parte PIX).

#### 4. **Money - Operações adicionais**
   - **Sugestão:** Adicionar `multiply(factor: number)` e `divide(divisor: number)` para cálculos de juros, taxas, etc.
   - **Cuidado:** Garantir arredondamento correto (padrão bancário: round half-even).

#### 5. **Idempotência em Operações Críticas**
   - **Recomendação:** Implementar Idempotency Keys (UUID) em:
     - Criação de despesa
     - Agendamento de pagamento
     - Liquidação de despesa
   - **Benefício:** Evita duplicação em retry/falha de rede (padrão Stripe, PagSeguro, etc.).

#### 6. **Auditoria e Compliance**
   - **Consideração:** Sistemas financeiros são fortemente regulados (Banco Central do Brasil).
   - **Sugestões:**
     - **Event Sourcing:** Considerar para auditoria completa (opcional, aumenta complexidade).
     - **Logs de auditoria:** Registrar todas as mudanças de estado com timestamp, usuário responsável, motivo.
     - **Retenção de dados:** Dados financeiros devem ser mantidos por 5 anos (legislação brasileira).

#### 7. **Soft Delete para Despesas**
   - **Recomendação:** Implementar soft delete (flag `deletedAt`) ao invés de deleção física.
   - **Motivo:** Auditoria e compliance exigem rastreabilidade histórica.

#### 8. **Segregação de Status (Payment)**
   - **Observação atual:** Expense tem apenas `status: ExpenseStatus`.
   - **Sugestão de mercado:** Separar em dois status:
     - `approvalStatus`: PENDING | APPROVED | REJECTED
     - `paymentStatus`: DRAFT | SCHEDULED | IN_PROCESSING | PAID | FAILED | CANCELLED | REFUNDED
   - **Benefício:** Clareza de responsabilidades; alinhado com workflows reais de pagamento.

### 🔐 Considerações de Segurança (futuro)

1. **Encriptação de dados sensíveis:**
   - PIX keys, dados bancários (`BankIdentity`), CNPJ devem ser encriptados em repouso.
   - Usar `@nestjs/crypto` ou libs como `crypto-js`.

2. **Autenticação e Autorização:**
   - Implementar controle de acesso por membro (ADMIN vs COLLABORATOR).
   - OAuth2 + JWT para APIs externas.

3. **Rate Limiting:**
   - Essencial para APIs de pagamento (evitar abuso e fraude).
   - Usar `@nestjs/throttler`.

4. **Validação de entrada rigorosa:**
   - Sanitizar e validar todos os inputs (DTOs) antes de chegar ao domínio.
   - Usar `class-validator` + `class-transformer`.

### 📊 Observabilidade e Monitoramento (futuro)

1. **Logging estruturado:**
   - Winston ou Pino com logs em JSON (facilita busca em ferramentas como ELK, Datadog).

2. **Métricas de negócio:**
   - Total de despesas criadas/aprovadas/rejeitadas por dia
   - Tempo médio de aprovação
   - Taxa de falha de pagamentos
   - Saldo total em contas ativas

3. **Tracing distribuído:**
   - OpenTelemetry para rastrear fluxos entre Account, Payment, SCD, Temporal.

4. **Alerting:**
   - Falhas de pagamento consecutivas
   - Saldo negativo (inconsistência crítica)
   - Timeout em workflows Temporal

### 🧪 Estratégia de Testes (complementar)

1. **Testes de mutação:** Usar Stryker para validar qualidade dos testes unitários.
2. **Testes de carga:** k6 ou Artillery para simular volume de transações.
3. **Testes de contrato:** Pact entre Account e Payment (garantir compatibilidade de eventos).
4. **Testes de caos:** Chaos Monkey para validar resiliência em falhas de RabbitMQ, Postgres, Temporal.

### 📚 Referências de Arquitetura

#### Domain-Driven Design
- **DDD Tático:** Vaughn Vernon, "Implementing Domain-Driven Design"
- **Aggregate Design:** Vaughn Vernon, "Effective Aggregate Design" (série de artigos)
- **DDD Fundamentals:** Eric Evans, "Domain-Driven Design: Tackling Complexity in the Heart of Software"

#### Microsserviços
- **Padrões de Microsserviços:** Chris Richardson, "Microservices Patterns: With examples in Java"
- **Microservices.io:** [https://microservices.io/](https://microservices.io/) — Catálogo completo de padrões
- **Building Microservices:** Sam Newman, "Building Microservices: Designing Fine-Grained Systems" (2ª edição)
- **Strangler Fig Pattern:** Martin Fowler, [https://martinfowler.com/bliki/StranglerFigApplication.html](https://martinfowler.com/bliki/StranglerFigApplication.html)
- **Database per Service:** [https://microservices.io/patterns/data/database-per-service.html](https://microservices.io/patterns/data/database-per-service.html)

#### Event-Driven Architecture
- **Event-Driven:** Martin Kleppmann, "Designing Data-Intensive Applications"
- **Event Sourcing:** Greg Young, [https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf](https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf)

#### Sagas e Consistência Distribuída
- **Saga Pattern:** Chris Richardson, [https://microservices.io/patterns/data/saga.html](https://microservices.io/patterns/data/saga.html)
- **Temporal.io Best Practices:** [https://docs.temporal.io/](https://docs.temporal.io/)
- **Consistency in Microservices:** Pat Helland, "Life beyond Distributed Transactions: an Apostate's Opinion"

#### Resiliência
- **Release It!:** Michael T. Nygard, "Release It! Design and Deploy Production-Ready Software" (2ª edição)
- **Circuit Breaker:** Martin Fowler, [https://martinfowler.com/bliki/CircuitBreaker.html](https://martinfowler.com/bliki/CircuitBreaker.html)

### 🌎 Compliance Brasil (Sistema Financeiro)

- **Resolução CMN 4.658/2018:** Requisitos de segurança cibernética.
- **LGPD (Lei 13.709/2018):** Proteção de dados pessoais (CPF, CNPJ são dados sensíveis).
- **PIX - Regulamentação BC:** [https://www.bcb.gov.br/estabilidadefinanceira/pix](https://www.bcb.gov.br/estabilidadefinanceira/pix)


## RNF

- NestJS + TypeScript
- PostgreSQL; valores monetários persistidos como `NUMERIC(15, 2)`
- RabbitMQ para integração entre contextos (e, na Fase 2, entre serviços)
- Temporal.io para sagas/workflows de longa duração (pagamento / liquidação / estorno)
- Testes com Jest, arquivos co-locados (ex.: `money.ts` e `money.spec.ts` no mesmo diretório, NUNCA usar `__tests__`)
- Isolamento estrito entre BCs: Payment não importa entidades internas de Account; colaboração via contrato (ID, eventos, application services)


## RN

### Account (implementado)
- Conta precisa de pelo menos um aprovador (Member ADMIN + ACTIVE)
- Transições de status: PENDING → VALIDATED|CLOSED; VALIDATED → ACTIVE|CLOSED; ACTIVE → BLOCKED|CLOSED; BLOCKED → ACTIVE|CLOSED; CLOSED → ∅
- Reserva, liberação e débito só com conta ACTIVE
- Reserva exige `availableBalance >= amount` (`balance - reservedBalance`)
- Liberação e confirmação de débito exigem `reservedBalance >= amount`

### Payment (implementado)
- Despesa nasce DRAFT com Approval PENDING
- Rejeição exige motivo
- Não se adiciona decisão se a alçada já está APPROVED ou REJECTED
- O mesmo aprovador não decide duas vezes
- `markAsPaid` exige alçada APPROVED e despesa não CANCELLED
- Não se cancela despesa já PAID

### Payment (alvo dos RF 05–07, ainda não implementado)
- Após aprovação, agendar pagamento reserva saldo na DigitalAccount e marca SCHEDULED
- Liquidação na SCD confirma débito e marca PAID
- Falha, cancelamento e estorno devolvem saldo reservado ou debitado (FAILED / CANCELLED / REFUNDED)
