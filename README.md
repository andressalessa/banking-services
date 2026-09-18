# Banking Services

> **Sistema de Contas Digitais e Pagamentos** — Demonstração de arquitetura moderna com migração de Modular Monolith para Microsserviços.

## 📋 Descrição

Projeto de estudo implementando um sistema bancário simplificado com:
- **Contas Digitais** (gestão de saldo, membros, aprovadores)
- **Pagamentos** (despesas, alçadas de aprovação, integração com SCD)

**Arquitetura:** Clean Architecture + Domain-Driven Design (DDD)  
**Stack:** NestJS, TypeScript, PostgreSQL, RabbitMQ, Temporal.io  
**Objetivo:** Demonstrar evolução arquitetural de Monólito → Microsserviços

---

## 🏗️ Arquitetura

### Fase 1: Modular Monolith (Atual)
Aplicação única com Bounded Contexts estritamente isolados:
- `src/modules/account` — Contexto de Conta Digital
- `src/modules/payment` — Contexto de Pagamentos
- `src/core` — Shared Kernel (entidades base, VOs, eventos)

### Fase 2: Microsserviços (Planejado)
Decomposição em serviços independentes:
- **Account Service** (Port 3001) — Gestão de contas e saldo
- **Payment Service** (Port 3002) — Gestão de despesas e pagamentos
- **API Gateway** — Roteamento e cross-cutting concerns
- **RabbitMQ** — Comunicação assíncrona (eventos)
- **Temporal.io** — Orquestração de sagas distribuídas

---

## 📚 Documentação

### Documentação Técnica

- **[Tasks (Checklist de Implementação)](docs/tasks.md)** — Passo a passo da Fase 1 e Fase 2
- **[Domain Structure (DDD)](docs/ddd-structure.md)** — Estrutura de domínio, agregados, entities, VOs
- **[Requirements (RF, RNF, RN)](docs/requirements.md)** — Requisitos funcionais, não-funcionais e regras de negócio
- **[Architecture Notes](docs/architecture-notes.md)** — Observações, inconsistências e sugestões de evolução
- **[Microservices Strategy](docs/microservices-strategy.md)** — Estratégia detalhada de migração
- **[Architecture Evolution](docs/architecture-evolution.md)** — Resumo executivo (ideal para PDI)

### Outros Documentos

- **[CommonJS vs Node/Nest](docs/commonjs-vs-nodenest.md)** — Notas técnicas

---

## 🎯 Funcionalidades (Requisitos Funcionais)

### Contas Digitais (Account BC)
- **RF 01:** Criar nova conta digital com aprovadores (PF)
- **RF 02:** Alterar status da conta (Ativar | Bloquear | Encerrar)

### Pagamentos (Payment BC)
- **RF 03:** Criar despesa (PENDING)
- **RF 04:** Aprovar ou Rejeitar despesa (alçada de aprovação)
- **RF 05:** Agendar pagamento (reserva saldo na conta)
- **RF 06:** Processar liquidação (débito confirmado pela SCD)
- **RF 07:** Cancelar ou Estornar despesa (devolve saldo)

---

## 🚀 Tecnologias

### Core
- **NestJS** — Framework backend
- **TypeScript** — Linguagem tipada
- **PostgreSQL** — Banco relacional (valores monetários em `NUMERIC(15, 2)`)

### Mensageria e Orquestração
- **RabbitMQ** — Message broker (eventos entre contextos)
- **Temporal.io** — Saga pattern e workflows de longa duração

### Testes
- **Jest** — Framework de testes (co-locado: `*.spec.ts`)

### Infraestrutura (Fase 2)
- **Docker** + **Docker Compose** — Containerização
- **NGINX** — API Gateway
- **OpenTelemetry** + **Jaeger** — Distributed Tracing
- **Prometheus** + **Grafana** — Métricas
- **ELK Stack** — Logging centralizado

---

## 🎓 Conhecimentos Demonstrados (PDI)

✅ **Domain-Driven Design (DDD):**
- Bounded Contexts
- Aggregates, Entities, Value Objects
- Domain Events

✅ **Clean Architecture:**
- Separação em camadas (Domain → Application → Infrastructure)
- Dependency Inversion Principle
- Either Pattern (functional error handling)

✅ **Microsserviços:**
- Decomposição de monólito
- Database per Service
- API Gateway, Service Discovery
- Event-Driven Architecture
- Saga Pattern (Temporal.io)

✅ **Resiliência:**
- Circuit Breaker
- Retry com backoff exponencial
- Timeout e bulkhead

✅ **Observabilidade:**
- Distributed Tracing
- Métricas (RED: Rate, Errors, Duration)
- Logging estruturado

✅ **DevOps:**
- Containerização (Docker)
- CI/CD por serviço
- Infrastructure as Code

---

## ⚙️ Setup do Projeto

### Pré-requisitos
- Node.js 20+
- npm ou yarn
- Docker + Docker Compose (para infra)

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

### Executar Aplicação

```bash
# Desenvolvimento (watch mode)
npm run start:dev

# Produção
npm run start:prod
```

### Executar Testes

```bash
# Testes unitários
npm run test

# Testes com cobertura
npm run test:cov

# Testes e2e
npm run test:e2e

# Testes em watch mode
npm run test:watch
```

### Infraestrutura (Docker Compose)

```bash
# Subir PostgreSQL, RabbitMQ, Temporal
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## 📊 Estrutura do Projeto

```
banking-services/
├── src/
│   ├── core/                      # Shared Kernel
│   │   ├── entities/              # Entity, AggregateRoot, UniqueEntityID
│   │   ├── value-objects/         # Money
│   │   ├── events/                # DomainEvent, DomainEvents
│   │   └── either.ts              # Either<L, R> (functional error handling)
│   ├── modules/
│   │   ├── account/               # Bounded Context: Account
│   │   │   ├── domain/
│   │   │   │   ├── entities/      # DigitalAccount (AR), Member (E)
│   │   │   │   ├── value-objects/ # AccountHolder, BankIdentity
│   │   │   │   └── enums/         # AccountStatus
│   │   │   ├── application/       # Use Cases (futuro)
│   │   │   └── infrastructure/    # Repositórios, HTTP (futuro)
│   │   └── payment/               # Bounded Context: Payment
│   │       ├── domain/
│   │       │   ├── entities/      # Expense (AR)
│   │       │   └── value-objects/ # Payee, PaymentDetails, Approval
│   │       ├── application/       # Use Cases (futuro)
│   │       └── infrastructure/    # Repositórios, HTTP (futuro)
│   └── main.ts
├── docs/
│   ├── tasks.md                   # Checklist de implementação
│   ├── ddd-structure.md           # Estrutura DDD (Bounded Contexts, Aggregates, VOs)
│   ├── requirements.md            # RF, RNF, RN (Requisitos e Regras de Negócio)
│   ├── architecture-notes.md      # Observações, inconsistências e sugestões
│   ├── microservices-strategy.md  # Estratégia de migração
│   ├── architecture-evolution.md  # Resumo executivo
│   └── glossary.md                # Glossário técnico
├── test/                          # Testes e2e
└── docker-compose.yml             # Infraestrutura local
```

---

## 🎯 Roadmap

### ✅ Concluído
- [x] Core (Entity, AggregateRoot, UniqueEntityID, Either, Money)
- [x] Domain Events (infraestrutura)
- [x] Account BC: DigitalAccount, Member, AccountHolder, BankIdentity
- [x] Payment BC: Expense, Payee, PaymentDetails, Approval
- [x] Testes parciais (expense.spec.ts, money.spec.ts, approval.spec.ts)
- [x] Documentação completa de microsserviços

### 🚧 Em Progresso (Fase 1)
- [ ] Domain Events (emitir nos ARs)
- [ ] Completar ciclo de pagamento (SCHEDULED, IN_PROCESSING, FAILED, REFUNDED)
- [ ] Use Cases (Application layer)
- [ ] Repositórios (PostgreSQL + ORM)
- [ ] HTTP Controllers (NestJS)
- [ ] Testes completos (unit, integration, e2e)

### 📅 Planejado (Fase 2)
- [ ] Database per Service
- [ ] Extrair Account Service
- [ ] Extrair Payment Service
- [ ] API Gateway (NGINX)
- [ ] RabbitMQ (eventos entre serviços)
- [ ] Temporal.io (Sagas distribuídas)
- [ ] Observabilidade (Jaeger, Prometheus, Grafana)

---

## 📚 Referências

### Livros
- Eric Evans — "Domain-Driven Design" (2003)
- Robert C. Martin — "Clean Architecture" (2017)
- Sam Newman — "Building Microservices" (2ª ed, 2021)
- Chris Richardson — "Microservices Patterns" (2018)
- Michael T. Nygard — "Release It!" (2ª ed, 2018)

### Artigos
- Martin Fowler — [Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html)
- Martin Fowler — [Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html)
- Chris Richardson — [Saga Pattern](https://microservices.io/patterns/data/saga.html)

### Recursos
- [Microservices.io](https://microservices.io/) — Catálogo de padrões
- [Temporal.io Docs](https://docs.temporal.io/) — Workflows e sagas
- [OpenTelemetry](https://opentelemetry.io/) — Observabilidade

---

## 👤 Autor

**Andressa Lessa**  
Projeto de estudo — Demonstração de conhecimento em arquitetura de microsserviços (PDI)

---

## 📄 Licença

Este é um projeto educacional para fins de estudo e demonstração técnica.
