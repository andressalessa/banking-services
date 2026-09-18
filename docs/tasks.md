# Checklist de implementação — Modular Monolith (Fase 1)

Convenções desta fase:

- Clean Architecture + DDD por Bounded Context (`account`, `payment`)
- Use Cases retornam `Either<Error, Result>`; domínio continua com validação estrita
- Testes em Jest, arquivos co-locados (ex.: `money.ts` e `money.spec.ts` no mesmo diretório, NUNCA usar `__tests__`)
- Payment não importa classes internas de Account; integração por IDs, eventos e application services

Estimativas são de estudo/implementação focada, não de calendário de time.

---

## Passo 1: Base de Domínio (`src/core`)
> **Estimativa de tempo:** 45 min – 1h
- [x] `src/core/either.ts` — Implementar `Left`, `Right` e o tipo `Either<L, R>` para Functional Error Handling.
- [x] `src/core/entities/unique-entity-id.ts` — Implementar classe de identificador único (wrapper para UUID).
- [x] `src/core/entities/entity.ts` — Implementar classe abstrata `Entity<Props>`.
- [x] `src/core/entities/aggregate-root.ts` — Implementar classe abstrata `AggregateRoot<Props>`.
- [x] `src/core/events` — `DomainEvent`, `DomainEvents`, `EventHandler`.

---

## Passo 2: Módulo de Conta Digital — Value Objects (`src/modules/account/domain`)
> **Estimativa de tempo:** 45 min – 1h
- [x] `money.ts` — VO com validações numéricas e operações (`sum`, `sub`, `isGreaterThan`). Vive em `src/core/value-objects`.
- [x] `account-holder.ts` — VO com validação de CNPJ e dados do titular.
- [x] `bank-identity.ts` — VO encapsulando os dados bancários na SCD (`externalAccountId`, `bankCode`, `branch`, `accountNumber`).

---

## Passo 3: Módulo de Conta Digital — Entidade e Agregado (`src/modules/account/domain`)
> **Estimativa de tempo:** 1h – 1h30
- [x] `member.ts` — Entidade interna de Membros (PF, cargo, status; admin ativo é aprovador).
- [x] `enums/account-status.ts` — Enum de status da conta (fora de `entities`).
- [x] `digital-account.ts` — Aggregate Root da Conta Digital.
  - Implementar métodos: `reserveBalance`, `releaseReservedBalance`, `confirmDebit` e `changeStatus`.

---

## Passo 4: Módulo de Pagamentos — Value Objects (`src/modules/payment/domain`)
> **Estimativa de tempo:** 45 min – 1h
- [x] `payee.ts` — VO do Favorecido/Recebedor.
- [x] `payment-details.ts` — VO com suporte a Pix, Boleto e TED.

---

## Passo 5: Módulo de Pagamentos — Entidade e Agregado (`src/modules/payment/domain`)
> **Estimativa de tempo:** 1h – 1h30
- [x] `expense-approval.ts` — Entidade/Histórico de aprovações. (órfã: Expense usa o VO `Approval`)
- [x] `approval.ts` — VO com validações das possíveis decisões.
- [x] `expense.ts` — Aggregate Root da Despesa.
  - Métodos atuais: `approve`, `reject`, `markAsPaid` e `cancel`.

---

## Passo 6: Fechar o domínio vs RF 03–07

> **Estimativa:** 2h – 3h  
> Hoje Expense só tem `DRAFT | PAID | CANCELLED`. Os RF 05–07 pedem ciclo de pagamento + saldo.

- [x] Decidir o destino de `ExpenseApproval` (entidade órfã): remover **ou** substituir `Decision` no VO Approval
- [x] `accountId` em Expense como `UniqueEntityID` (não `string`)
- [x] Enums de Payment em `domain/enums`: `ExpenseStatus` / `PaymentStatus` e status de Approval
- [ ] Evoluir ciclo de pagamento no AR Expense:
  - [x] Status alvo: DRAFT, PENDING, SCHEDULED, IN_PROCESSING, PAID, FAILED, CANCELLED, REFUNDED
  - [x] Métodos: `schedule`, `startProcessing`, `markAsPaid`, `fail`, `cancel`, `refund` (além de `approve` / `reject`)
  - [ ] Campos: `scheduledTo?`, `updatedAt?` (alinhado ao RF)
- [ ] Domain events nos ARs (ex.: `ExpenseScheduled`, `ExpensePaid`, `AccountBalanceReserved`) — a infra de eventos em `core` já existe, os eventos de negócio não
- [ ] Eventos de domínio ainda não disparam nos métodos atuais; emitir nos pontos de mutação relevantes

---

## Passo 7: Testes de domínio

> **Estimativa:** 2h – 3h  
> **Status:** Jest já configurado. Alguns testes existem (`expense.spec.ts`, `money.spec.ts`, `approval.spec.ts`, `either.spec.ts`).  
> **Padrão de testes:** Co-locado (ex.: `money.ts` e `money.spec.ts` na mesma pasta, NUNCA usar `__tests__`).

- [ ] `digital-account.spec.ts` — reserva de saldo (sucesso e `InsufficientBalanceError`), confirmação de débito, alteração de status, criação sem aprovador, conta não ACTIVE
- [ ] `expense.spec.ts` — completar fluxo de vida (aprovação, rejeição, agendamento, liquidação, cancelamento e estorno)
- [ ] Completar testes de VOs: PaymentDetails, Payee, AccountHolder, BankIdentity, Member
- [ ] Garantir cobertura > 80% no domínio

**Nota:** Testes já estão co-locados corretamente conforme padrão do projeto.

---

## Passo 8: Camada de aplicação (Use Cases)

> **Estimativa:** 3h – 4h  
> Um use case por RF. Contratos de repositório no domínio/application, sem ORM ainda (in-memory nos testes).

### Account
- [ ] `CreateDigitalAccount` (RF 01) — exige pelo menos um ADMIN ativo
- [ ] `ChangeDigitalAccountStatus` (RF 02) — Ativar | Bloquear | Encerrar
- [ ] Repositório: `DigitalAccountRepository` (interface)

### Payment
- [ ] `CreateExpense` (RF 03)
- [ ] `ApproveExpense` / `RejectExpense` (RF 04)
- [ ] `ScheduleExpense` (RF 05) — orquestra reserva de saldo na conta (via serviço de application, não importando o AR Account de dentro do domínio Payment)
- [ ] `SettleExpense` (RF 06) — confirma débito após retorno SCD
- [ ] `CancelExpense` / `RefundExpense` (RF 07)
- [ ] Repositório: `ExpenseRepository` (interface)
- [ ] Portas de integração: `AccountBalancePort` (reservar / liberar / debitar) e `ScdPaymentPort` (envio/liquidação)

Use cases retornam `Either`. Testes unitários com repositórios in-memory.

---

## Passo 9: Persistence (PostgreSQL)

> **Estimativa:** 3h – 4h

- [ ] Docker Compose: PostgreSQL
- [ ] ORM/mapper (Prisma ou Drizzle — escolher um e padronizar)
- [ ] `Money` persistido como `NUMERIC(15, 2)`
- [ ] Tabelas: accounts, members, expenses, expense_approval_decisions (ou JSON das decisions), payment_details
- [ ] Implementar `DigitalAccountRepository` e `ExpenseRepository`
- [ ] Mapper domínio ↔ persistência (não vazar ORM no domínio)
- [ ] Testes de repositório (testcontainers ou DB de teste)

---

## Passo 10: HTTP / Nest modules

> **Estimativa:** 3h – 4h  
> Isolar módulos Nest por BC. Remover `AppController`/`AppService` genéricos quando os módulos reais existirem.

- [ ] `AccountModule` + controllers/DTOs/pipes dos RF 01–02
- [ ] `PaymentModule` + controllers/DTOs dos RF 03–07
- [ ] Validação de entrada (DTO) ≠ validação de domínio
- [ ] Mapeamento de erros de domínio / Either → HTTP (400/404/409/422)
- [ ] Testes de contrato HTTP (supertest + Jest)

---

## Passo 11: Integração entre contextos (eventos + RabbitMQ)

> **Estimativa:** 3h – 4h  
> No monólito, handlers podem ser in-process primeiro; a mesma porta publica no broker.

- [ ] Dispatch de DomainEvents após persistência (unit of work)
- [ ] Contratos de integração (payloads versionados) Account ↔ Payment
- [ ] RabbitMQ no Docker Compose
- [ ] Publisher/consumer na infrastructure (Payment não acessa repositório de Account diretamente para efeitos colaterais)
- [ ] Testes de handler (reserva de saldo ao agendar, etc.)

---

## Passo 12: Temporal.io (sagas de pagamento)

> **Estimativa:** 4h – 6h  
> Workflow de longa duração: agendar → enviar SCD → aguardar liquidação → PAID | FAILED | timeout → compensar saldo.

- [ ] Temporal no Docker Compose (dev)
- [ ] Worker Nest + workflows/activities
- [ ] Saga RF 05–07: schedule, processing, settle, fail, cancel, refund (compensações em Account)
- [ ] Idempotência das activities
- [ ] Testes de workflow (time-skipping do Temporal)

---

## Passo 13: SCD (porta + fake)

> **Estimativa:** 2h – 3h  
> A SCD é externa; nesta fase um adapter fake/sandbox basta.

- [ ] Interface `ScdGateway`: criar conta (BankIdentity), iniciar pagamento, consultar status, estorno
- [ ] Adapter fake para e2e local
- [ ] Webhook/consumer de retorno de liquidação → `SettleExpense` / `fail`

---

## Passo 14: Qualidade e prontidão da Fase 1

> **Estimativa:** 2h – 3h

- [ ] E2E dos RF 01–07 (conta → despesa → aprovação → agenda → liquida / cancela / estorna)
- [ ] README do projeto (stack, como subir Postgres/Rabbit/Temporal, scripts)
- [ ] Lint/test no CI
- [ ] Revisar isolamento das pastas (`account` ↛ `payment/domain` e vice-versa)

---

## Fase 2 — Migração para Microsserviços

> **Objetivo:** Demonstrar conhecimento em arquitetura de microsserviços, mesmo em projeto pequeno.  
> **Pré-requisito:** Fase 1 concluída com Bounded Contexts estritamente isolados.

### Estratégia de Migração: Strangler Fig Pattern

A migração será **incremental**, mantendo o monólito funcionando enquanto os microsserviços são extraídos gradualmente.

#### Passo 2.1: Preparação do Monólito (refatoração)
> **Estimativa:** 2h – 3h

- [ ] **Revisar isolamento de contextos:**
  - [ ] Garantir que Payment **não** importa classes internas de Account
  - [ ] Validar que comunicação entre BCs ocorre apenas via:
    - IDs (strings/UniqueEntityID)
    - Eventos de domínio (RabbitMQ)
    - Application Services (portas/interfaces)
  
- [ ] **Criar contratos de API explícitos:**
  - [ ] Definir DTOs de integração entre Account e Payment
  - [ ] Versionar contratos (v1) para evitar breaking changes futuros
  
- [ ] **Externalizar configurações:**
  - [ ] Usar variáveis de ambiente para URLs de serviços (preparar para service discovery)
  - [ ] Separar configurações de Account e Payment em arquivos distintos

#### Passo 2.2: Database per Service
> **Estimativa:** 3h – 4h

- [ ] **Separar bancos de dados:**
  - [ ] Criar schema `account_service` no PostgreSQL
  - [ ] Criar schema `payment_service` no PostgreSQL
  - [ ] Migrar tabelas: `accounts`, `members` → `account_service`
  - [ ] Migrar tabelas: `expenses`, `expense_approval_decisions` → `payment_service`
  
- [ ] **Remover joins entre contextos:**
  - [ ] Payment não pode fazer JOIN com tabelas de Account
  - [ ] Usar cache local ou replicação eventual para dados de referência
  
- [ ] **Gerenciar dados duplicados:**
  - [ ] Payment pode manter cache de `accountStatus` (atualizado via eventos)
  - [ ] Implementar eventual consistency

#### Passo 2.3: Extrair Account Service
> **Estimativa:** 4h – 6h

- [ ] **Criar repositório separado:** `account-service/`
  - [ ] Copiar `src/modules/account` + `src/core` (shared kernel)
  - [ ] Configurar NestJS standalone
  - [ ] Configurar conexão com `account_service` schema
  
- [ ] **Expor APIs REST:**
  - [ ] `POST /api/v1/accounts` — Criar conta
  - [ ] `PATCH /api/v1/accounts/:id/status` — Alterar status
  - [ ] `GET /api/v1/accounts/:id` — Consultar conta
  - [ ] `POST /api/v1/accounts/:id/balance/reserve` — Reservar saldo (chamado por Payment)
  - [ ] `POST /api/v1/accounts/:id/balance/release` — Liberar saldo
  - [ ] `POST /api/v1/accounts/:id/balance/debit` — Confirmar débito
  
- [ ] **Publicar eventos de domínio no RabbitMQ:**
  - [ ] `account.balance.reserved`
  - [ ] `account.balance.debited`
  - [ ] `account.status.changed`
  
- [ ] **Configurar Docker Compose:**
  - [ ] Container `account-service` na porta 3001
  - [ ] Health check endpoint: `GET /health`

#### Passo 2.4: Extrair Payment Service
> **Estimativa:** 4h – 6h

- [ ] **Criar repositório separado:** `payment-service/`
  - [ ] Copiar `src/modules/payment` + `src/core` (shared kernel)
  - [ ] Configurar NestJS standalone
  - [ ] Configurar conexão com `payment_service` schema
  
- [ ] **Expor APIs REST:**
  - [ ] `POST /api/v1/expenses` — Criar despesa
  - [ ] `POST /api/v1/expenses/:id/approve` — Aprovar
  - [ ] `POST /api/v1/expenses/:id/reject` — Rejeitar
  - [ ] `POST /api/v1/expenses/:id/schedule` — Agendar pagamento
  - [ ] `POST /api/v1/expenses/:id/settle` — Liquidar
  - [ ] `POST /api/v1/expenses/:id/cancel` — Cancelar
  - [ ] `POST /api/v1/expenses/:id/refund` — Estornar
  
- [ ] **Consumir eventos de Account:**
  - [ ] Subscriber: `account.status.changed` (atualizar cache local)
  - [ ] Subscriber: `account.balance.reserved` (confirmar reserva)
  
- [ ] **Integrar com Account Service via HTTP:**
  - [ ] Cliente HTTP (Axios) para chamar Account API
  - [ ] Implementar retry + circuit breaker (Resilience4j ou similar)
  - [ ] Timeout configurável (ex.: 5s)
  
- [ ] **Configurar Docker Compose:**
  - [ ] Container `payment-service` na porta 3002

#### Passo 2.5: API Gateway
> **Estimativa:** 2h – 3h

- [ ] **Escolher solução:** Kong, NGINX, AWS API Gateway, ou NestJS Gateway
- [ ] **Configurar rotas:**
  - [ ] `/api/v1/accounts/*` → `account-service:3001`
  - [ ] `/api/v1/expenses/*` → `payment-service:3002`
  
- [ ] **Implementar cross-cutting concerns:**
  - [ ] Autenticação/Autorização (JWT)
  - [ ] Rate Limiting
  - [ ] Request/Response logging
  - [ ] CORS
  
- [ ] **Load Balancing (futuro):**
  - [ ] Round-robin entre múltiplas instâncias de cada serviço

#### Passo 2.6: Comunicação Assíncrona (RabbitMQ)
> **Estimativa:** 2h – 3h

- [ ] **Configurar exchanges:**
  - [ ] `account.events` (topic exchange)
  - [ ] `payment.events` (topic exchange)
  
- [ ] **Configurar queues:**
  - [ ] `payment-service.account-events` (consumidor de eventos de Account)
  - [ ] `account-service.payment-events` (se necessário)
  
- [ ] **Dead Letter Queue (DLQ):**
  - [ ] Roteamento de mensagens falhadas para análise
  
- [ ] **Garantir idempotência:**
  - [ ] Event ID único (UUID)
  - [ ] Tabela de processamento: `processed_events(event_id, processed_at)`

#### Passo 2.7: Temporal.io para Sagas Distribuídas
> **Estimativa:** 4h – 6h

- [ ] **Workflow: SchedulePayment (distribuído)**
  ```
  1. Payment: Criar despesa (estado SCHEDULED)
  2. Account: Reservar saldo (activity, com compensação)
  3. SCD: Enviar pagamento (activity, com compensação)
  4. Aguardar retorno SCD (webhook ou polling)
  5. Account: Confirmar débito (activity)
  6. Payment: Marcar como PAID (activity)
  
  Compensações (em caso de falha):
  - Account: Liberar saldo reservado
  - SCD: Cancelar pagamento
  - Payment: Marcar como FAILED
  ```
  
- [ ] **Workers em cada serviço:**
  - [ ] `account-service`: Worker para activities de saldo
  - [ ] `payment-service`: Worker para activities de despesa
  
- [ ] **Observabilidade:**
  - [ ] Temporal UI para visualizar workflows em execução
  - [ ] Logs estruturados em cada activity

#### Passo 2.8: Service Discovery (opcional, para produção)
> **Estimativa:** 2h – 3h

- [ ] **Escolher solução:** Consul, Eureka, ou Kubernetes DNS
- [ ] **Registrar serviços:**
  - [ ] Account Service registra-se como `account-service`
  - [ ] Payment Service registra-se como `payment-service`
  
- [ ] **Health checks:**
  - [ ] Temporal Worker health
  - [ ] Database connection health
  - [ ] RabbitMQ connection health

#### Passo 2.9: Resiliência e Observabilidade
> **Estimativa:** 3h – 4h

- [ ] **Circuit Breaker:** Implementar em chamadas HTTP entre serviços
- [ ] **Retry com backoff exponencial**
- [ ] **Timeout configurável por endpoint**
- [ ] **Distributed Tracing:**
  - [ ] OpenTelemetry
  - [ ] Jaeger ou Zipkin para visualização
  - [ ] Propagação de Trace ID entre serviços
  
- [ ] **Métricas:**
  - [ ] Prometheus exporters em cada serviço
  - [ ] Dashboards Grafana:
    - Request rate, error rate, duration (RED metrics)
    - Latência P50, P95, P99
    - Taxa de sucesso de pagamentos
  
- [ ] **Logging centralizado:**
  - [ ] ELK Stack ou Loki
  - [ ] Correlação de logs via Request ID

#### Passo 2.10: Deployment e CI/CD
> **Estimativa:** 3h – 4h

- [ ] **Dockerfiles otimizados:**
  - [ ] Multi-stage builds
  - [ ] Imagens baseadas em Alpine (reduzir tamanho)
  
- [ ] **Docker Compose completo:**
  ```yaml
  services:
    - postgres (schemas: account_service, payment_service)
    - rabbitmq
    - temporal
    - account-service (porta 3001)
    - payment-service (porta 3002)
    - api-gateway (porta 3000)
  ```
  
- [ ] **CI/CD (GitHub Actions ou GitLab CI):**
  - [ ] Pipeline por serviço (build, test, deploy independentes)
  - [ ] Testes de integração entre serviços
  - [ ] Deploy em ambiente de staging
  
- [ ] **Kubernetes (opcional, para produção):**
  - [ ] Helm charts por serviço
  - [ ] ConfigMaps e Secrets
  - [ ] Horizontal Pod Autoscaling (HPA)

---

### 📊 Demonstração de Conhecimentos (PDI)

Esta migração demonstra:

✅ **Arquitetura de Microsserviços:**
- Decomposição de monólito em serviços independentes
- Database per Service pattern
- API Gateway pattern
- Service Discovery

✅ **Comunicação entre Serviços:**
- Síncrona: REST APIs com resiliência
- Assíncrona: Event-driven via RabbitMQ
- Sagas distribuídas: Temporal.io

✅ **Resiliência e Observabilidade:**
- Circuit Breaker, Retry, Timeout
- Distributed Tracing (OpenTelemetry)
- Métricas (Prometheus + Grafana)
- Logging centralizado

✅ **DevOps e Cloud-Native:**
- Containerização (Docker)
- Orquestração (Kubernetes - opcional)
- CI/CD por serviço
- Infrastructure as Code (Docker Compose, Helm)

✅ **Padrões de Migração:**
- Strangler Fig Pattern
- Eventual Consistency
- Idempotência
- Compensating Transactions (Sagas)

---

## 📋 Sugestões e Observações de Arquitetura

### ✅ Pontos Fortes (Alinhados com Mercado)

1. **Separação de Contextos:** A estratégia de Bounded Contexts está alinhada com DDD tático e padrões de mercado para sistemas financeiros.
2. **Either Pattern:** Uso de `Either<Error, Result>` para functional error handling é uma prática robusta que facilita tratamento de erros previsíveis.
3. **Money como VO:** Implementação de Money em centavos evita problemas de arredondamento (padrão em fintechs).
4. **Temporal.io:** Escolha excelente para sagas de longa duração, oferece resiliência e observabilidade nativa.
5. **Aggregate Roots bem definidos:** DigitalAccount e Expense estão corretamente desenhados como ARs, mantendo invariantes de negócio.

### 💡 Sugestões de Melhoria

#### 1. **Application Services (não implementado ainda)**
   - **Recomendação:** Criar uma camada explícita de Application Services para orquestrar Use Cases complexos.
   - **Exemplo:** `AccountBalanceService` para encapsular lógica de reserva/liberação/débito que será chamada por Payment.
   - **Benefício:** Evita acoplamento direto entre contextos e facilita evolução independente.

#### 2. **Domain Events (parcialmente implementado)**
   - **Status atual:** Infraestrutura de eventos existe (`DomainEvent`, `DomainEvents`, `EventHandler`), mas eventos de negócio ainda não foram criados.
   - **Recomendação:** Definir eventos explícitos:
     - Account: `BalanceReserved`, `BalanceDebited`, `AccountStatusChanged`
     - Payment: `ExpenseApproved`, `ExpenseScheduled`, `ExpensePaid`, `ExpenseFailed`, `ExpenseRefunded`
   - **Benefício:** Permite auditoria completa e integração assíncrona entre contextos.

#### 3. **Validação de CNPJ (AccountHolder)**
   - **Observação:** Validar formato e dígitos verificadores do CNPJ no VO.
   - **Recomendação:** Usar biblioteca como `@fnando/cnpj` ou implementar validação com algoritmo oficial.

#### 4. **Idempotência em Use Cases**
   - **Recomendação:** Implementar Idempotency Keys para operações críticas (criação de despesa, agendamento de pagamento).
   - **Benefício:** Evita duplicação de operações em cenários de retry/falha de rede (padrão em APIs de pagamento como Stripe).

#### 5. **Auditoria e Event Sourcing (opcional)**
   - **Consideração:** Para sistemas financeiros, considerar Event Sourcing para auditoria completa de mudanças de estado.
   - **Trade-off:** Aumenta complexidade, mas garante rastreabilidade total (exigido por regulamentação financeira).

#### 6. **Repository Pattern - Especificações (futuro)**
   - **Recomendação:** Ao implementar repositórios, considerar usar Specification Pattern para queries complexas.
   - **Exemplo:** `FindExpensesByAccountAndStatusSpec`, `FindPendingApprovalsSpec`.

#### 7. **Testes de Contrato entre Contextos**
   - **Recomendação:** Além de testes unitários, criar testes de contrato (Consumer-Driven Contract Testing) entre Account e Payment.
   - **Ferramenta sugerida:** Pact ou testes de integração focados nos contratos de eventos.

#### 8. **accountId em Expense**
   - **Status:** Atualmente é `string`, deveria ser `UniqueEntityID` (já identificado no Passo 6).
   - **Prioridade:** Alta, pois mantém consistência de tipos no domínio.

#### 9. **ExpenseApproval (entidade órfã)**
   - **Status:** Existe no código mas não é usada pelo AR Expense. O VO `Approval` gerencia alçadas.
   - **Decisão pendente:** Remover `ExpenseApproval` ou substituir o VO `Approval` por ela.
   - **Recomendação:** Se múltiplos níveis de alçada forem necessários no futuro, manter `ExpenseApproval` como entidade; caso contrário, remover para evitar confusão.

#### 10. **Configuração de Jest**
   - **Status:** Jest já configurado e funcionando corretamente.
   - **Otimização sugerida:** Considerar usar `@swc/jest` para transpilação mais rápida (alternativa ao `ts-jest`).

### 🔒 Considerações de Segurança (futuro)

- **Autenticação/Autorização:** Ainda não implementado. Considerar OAuth2/JWT para APIs.
- **Rate Limiting:** Essencial para APIs de pagamento (evitar abuso).
- **Encriptação de Dados Sensíveis:** PIX keys, dados bancários devem ser encriptados em repouso.
- **PCI-DSS Compliance:** Se processar dados de cartão, seguir padrões PCI.

### 📊 Observabilidade (futuro)

- **Logging estruturado:** Usar Winston ou Pino com logs em JSON.
- **Métricas:** Prometheus + Grafana para monitorar latência, taxa de erro, throughput.
- **Tracing distribuído:** OpenTelemetry para rastrear fluxos entre Account/Payment/SCD.
- **Alerting:** PagerDuty ou Opsgenie para incidentes críticos (falhas de pagamento, saldo inconsistente).

---

## 📚 Referências de Mercado

- **Domain-Driven Design:** Eric Evans, "Domain-Driven Design: Tackling Complexity in the Heart of Software"
- **Clean Architecture:** Robert C. Martin, "Clean Architecture: A Craftsman's Guide to Software Structure and Design"
- **Saga Pattern:** Chris Richardson, "Microservices Patterns: With examples in Java"
- **Money Pattern:** Martin Fowler, "Patterns of Enterprise Application Architecture"
- **Temporal.io:** [https://docs.temporal.io/](https://docs.temporal.io/) — Documentação oficial sobre workflows e sagas
