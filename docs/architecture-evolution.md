# Evolução Arquitetural: Do Monólito aos Microsserviços

> **Resumo Executivo:** Este documento apresenta a estratégia de evolução arquitetural do projeto Banking Services, demonstrando conhecimento em arquitetura moderna de software e padrões de migração para microsserviços.

---

## 🎯 Visão Geral

### Fase 1: Modular Monolith (Base Sólida)
**Status:** Em implementação  
**Objetivo:** Criar fundação com Bounded Contexts isolados  
**Duração estimada:** 25-35 horas de desenvolvimento  

### Fase 2: Microsserviços (Escalabilidade)
**Status:** Planejado (documentação completa)  
**Objetivo:** Demonstrar conhecimento em sistemas distribuídos  
**Duração estimada:** 25-30 horas de desenvolvimento  

---

## 📐 Comparação Arquitetural

### Antes: Modular Monolith

```
┌─────────────────────────────────────────────────┐
│           Banking Services (Monolith)           │
│                                                 │
│  ┌──────────────┐        ┌──────────────┐      │
│  │   Account    │        │   Payment    │      │
│  │   Module     │◄──────►│   Module     │      │
│  │              │ Events │              │      │
│  └──────┬───────┘        └──────┬───────┘      │
│         │                       │              │
│         └───────────┬───────────┘              │
│                     │                          │
│              ┌──────▼──────┐                   │
│              │ PostgreSQL  │                   │
│              │  (Shared)   │                   │
│              └─────────────┘                   │
└─────────────────────────────────────────────────┘
```

**Características:**
- ✅ Um único deploy
- ✅ Transações ACID locais
- ✅ Baixa latência (in-process)
- ⚠️ Escalabilidade vertical
- ⚠️ Acoplamento de deploy
- ⚠️ Falha afeta todo o sistema

---

### Depois: Microsserviços

```
                    ┌─────────────────┐
                    │   API Gateway   │
                    │  (Port 80/443)  │
                    └────────┬────────┘
                             │
              ┏━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━┓
              ▼                              ▼
   ┌────────────────────┐         ┌────────────────────┐
   │ Account Service    │         │ Payment Service    │
   │ (Port 3001)        │◄───────►│ (Port 3002)        │
   │                    │  REST   │                    │
   │ - Account BC       │         │ - Payment BC       │
   │ - Balance Mgmt     │         │ - Expense Mgmt     │
   └─────────┬──────────┘         └─────────┬──────────┘
             │                               │
             │ Events                        │ Events
             └────────────┬──────────────────┘
                          ▼
                 ┌─────────────────┐
                 │    RabbitMQ     │
                 │ (Message Broker)│
                 └────────┬─────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Temporal.io   │
                 │  (Orchestrator) │
                 └─────────────────┘

   ┌──────────────┐         ┌──────────────┐
   │ PostgreSQL   │         │ PostgreSQL   │
   │ account_db   │         │ payment_db   │
   └──────────────┘         └──────────────┘
```

**Características:**
- ✅ Deploy independente por serviço
- ✅ Escalabilidade horizontal (por serviço)
- ✅ Resiliência (falha isolada)
- ✅ Autonomia de times
- ⚠️ Eventual Consistency
- ⚠️ Maior complexidade operacional
- ⚠️ Latência de rede

---

## 🔄 Estratégia de Migração: Strangler Fig Pattern

### Por que Strangler Fig?

- ✅ Migração **incremental** (não big bang)
- ✅ Risco reduzido (monólito continua funcionando)
- ✅ Validação progressiva (um serviço por vez)
- ✅ Rollback facilitado

### Fluxo de Migração

```
Fase 1: Monólito com BCs isolados
   ↓
Passo 1: Criar Account Service (extração)
   ↓
Passo 2: API Gateway roteia /accounts → Account Service
   ↓
Passo 3: Monólito delega para Account Service (proxy)
   ↓
Passo 4: Criar Payment Service (extração)
   ↓
Passo 5: API Gateway roteia /expenses → Payment Service
   ↓
Passo 6: Remover código extraído do monólito
   ↓
Passo 7: Desligar monólito (100% em microsserviços)
```

---

## 🎓 Conhecimentos Demonstrados (PDI)

### 1. Domain-Driven Design (DDD)

**Conceitos Aplicados:**
- ✅ Bounded Contexts (Account, Payment)
- ✅ Aggregates (DigitalAccount, Expense)
- ✅ Value Objects (Money, AccountHolder, Payee)
- ✅ Domain Events (balance.reserved, expense.paid)
- ✅ Shared Kernel (core entities e VOs)

**Referência:** Eric Evans, "Domain-Driven Design" (2003)

---

### 2. Clean Architecture

**Camadas Implementadas:**
```
┌─────────────────────────────────────────┐
│          HTTP / REST API                │ ← Infrastructure
├─────────────────────────────────────────┤
│       Use Cases (Application)           │ ← Application
├─────────────────────────────────────────┤
│    Domain (Entities, VOs, ARs)          │ ← Domain (Core)
└─────────────────────────────────────────┘
```

**Princípios:**
- ✅ Dependências apontam para dentro (Dependency Inversion)
- ✅ Domínio independente de frameworks
- ✅ Use Cases orquestram lógica de negócio
- ✅ Infrastructure implementa portas (interfaces)

**Referência:** Robert C. Martin, "Clean Architecture" (2017)

---

### 3. Arquitetura de Microsserviços

**Padrões Implementados:**

#### 3.1. Database per Service
- Cada serviço tem seu próprio banco de dados
- Evita acoplamento via schema compartilhado
- Permite evolução independente de dados

#### 3.2. API Gateway
- Ponto único de entrada
- Cross-cutting concerns (auth, rate limiting, logging)
- Roteamento por contexto

#### 3.3. Event-Driven Architecture
- Comunicação assíncrona via RabbitMQ
- Eventual Consistency entre serviços
- Publish/Subscribe para integração

#### 3.4. Saga Pattern (Orquestrada)
- Temporal.io coordena transações distribuídas
- Compensating transactions em caso de falha
- Garantia de consistência eventual

**Referências:** 
- Sam Newman, "Building Microservices" (2021)
- Chris Richardson, "Microservices Patterns" (2018)

---

### 4. Resiliência e Fault Tolerance

**Padrões Implementados:**

#### 4.1. Circuit Breaker
```typescript
Estados: CLOSED → OPEN → HALF_OPEN
- CLOSED: Requisições passam normalmente
- OPEN: Falha rápida (sem chamar serviço)
- HALF_OPEN: Tenta novamente após timeout
```

#### 4.2. Retry com Backoff Exponencial
```
Tentativa 1: imediato
Tentativa 2: 1s depois
Tentativa 3: 2s depois
Tentativa 4: 4s depois
```

#### 4.3. Timeout
```typescript
axios.post(url, data, { timeout: 5000 }); // 5s
```

**Referência:** Michael T. Nygard, "Release It!" (2018)

---

### 5. Observabilidade Distribuída

**Três Pilares Implementados:**

#### 5.1. Distributed Tracing (OpenTelemetry + Jaeger)
- Rastrear requisição entre múltiplos serviços
- Identificar bottlenecks de latência
- Correlacionar erros entre serviços

#### 5.2. Métricas (Prometheus + Grafana)
- **RED Metrics:** Rate, Errors, Duration
- Latência P50, P95, P99
- Taxa de sucesso de pagamentos
- Circuit breakers abertos

#### 5.3. Logging Centralizado (ELK Stack)
- Logs estruturados (JSON)
- Correlação via Request ID
- Busca e análise centralizada

**Referência:** Cindy Sridharan, "Distributed Systems Observability" (2018)

---

### 6. DevOps e CI/CD

**Práticas Aplicadas:**

#### 6.1. Containerização (Docker)
- Dockerfile otimizado (multi-stage build)
- Imagens leves (Alpine Linux)
- Ambiente consistente (dev = prod)

#### 6.2. Orquestração (Docker Compose / Kubernetes)
- Deployment declarativo
- Service discovery automático
- Health checks e auto-restart

#### 6.3. CI/CD por Serviço
- Pipeline independente por microsserviço
- Testes automatizados (unit, integration, e2e)
- Deploy em ambiente de staging

**Referência:** Gene Kim, "The DevOps Handbook" (2016)

---

## 📊 Métricas de Qualidade

### Cobertura de Testes (Meta)
- **Domínio:** > 80%
- **Use Cases:** > 70%
- **Integration:** Principais fluxos (RF 01-07)

### Performance (SLA)
- **Latência P95:** < 500ms (endpoints de leitura)
- **Latência P95:** < 2s (endpoints de escrita)
- **Availability:** > 99% (SLA de produção)

### Resiliência
- **Circuit Breaker threshold:** 50% de falhas
- **Retry max attempts:** 3 tentativas
- **Timeout padrão:** 5s

---

## 🗂️ Estrutura de Documentação

### Arquivos Criados

1. **`tasks.md`** — Checklist de implementação (Fase 1 + Fase 2)
2. **`ddd-structure.md`** — Estrutura DDD (Bounded Contexts, Aggregates, Entities, VOs)
3. **`requirements.md`** — Requisitos funcionais (RF), não-funcionais (RNF) e regras de negócio (RN)
4. **`architecture-notes.md`** — Observações, inconsistências detectadas e sugestões de evolução
5. **`microservices-strategy.md`** — Estratégia detalhada de migração
6. **`architecture-evolution.md`** (este) — Resumo executivo

### Diagramas Incluídos

- ✅ Topologia de microsserviços
- ✅ Fluxo de migração (Strangler Fig)
- ✅ Arquitetura em camadas (Clean Architecture)
- ✅ Event flow (RabbitMQ)
- ✅ Saga workflow (Temporal.io)

---

## 🎯 Apresentação para PDI

### Slide 1: Contexto
**Projeto:** Banking Services (Sistema de contas digitais e pagamentos)  
**Tecnologias:** NestJS, PostgreSQL, RabbitMQ, Temporal.io  
**Objetivo:** Demonstrar arquitetura moderna (Monólito → Microsserviços)  

### Slide 2: Fase 1 - Modular Monolith
- Bounded Contexts isolados (DDD)
- Clean Architecture + Either Pattern
- Domain Events (preparação para microsserviços)

### Slide 3: Fase 2 - Microsserviços
- Decomposição em Account Service + Payment Service
- Database per Service
- Comunicação REST + Event-Driven

### Slide 4: Padrões de Resiliência
- Circuit Breaker, Retry, Timeout
- Saga Pattern (Temporal.io)
- Compensating Transactions

### Slide 5: Observabilidade
- Distributed Tracing (Jaeger)
- Métricas (Prometheus + Grafana)
- Logging centralizado (ELK)

### Slide 6: Resultados
- Deploy independente por serviço
- Escalabilidade horizontal
- Resiliência aumentada

---

## ✅ Checklist de Apresentação

- [ ] Demonstrar código do Modular Monolith (Fase 1)
- [ ] Apresentar diagramas de arquitetura (antes/depois)
- [ ] Explicar estratégia de migração (Strangler Fig)
- [ ] Mostrar implementação de Circuit Breaker
- [ ] Demonstrar workflow Temporal.io (Saga)
- [ ] Exibir dashboards de observabilidade (Grafana)
- [ ] Discutir trade-offs (Monólito vs Microsserviços)
- [ ] Apresentar referências bibliográficas

---

## 📚 Bibliografia Recomendada

### Livros Essenciais
1. **Eric Evans** — "Domain-Driven Design" (2003)
2. **Robert C. Martin** — "Clean Architecture" (2017)
3. **Sam Newman** — "Building Microservices" (2ª ed, 2021)
4. **Chris Richardson** — "Microservices Patterns" (2018)
5. **Michael T. Nygard** — "Release It!" (2ª ed, 2018)
6. **Martin Kleppmann** — "Designing Data-Intensive Applications" (2017)

### Artigos Clássicos
- Martin Fowler — "StranglerFigApplication"
- Martin Fowler — "CircuitBreaker"
- Pat Helland — "Life beyond Distributed Transactions"

### Recursos Online
- https://microservices.io/ (catálogo de padrões)
- https://docs.temporal.io/ (documentação Temporal)
- https://www.opentelemetry.io/ (observabilidade)

---

## 🚀 Próximos Passos

### Para o PDI:
1. ✅ Documentação completa criada
2. [ ] Implementar Fase 1 (Modular Monolith)
3. [ ] Criar diagramas visuais (C4 Model)
4. [ ] Implementar Fase 2 (Microsserviços) - opcional
5. [ ] Preparar apresentação (slides)

### Para Produção (futuro):
- Implementar autenticação/autorização (OAuth2 + JWT)
- Configurar CI/CD completo
- Deploy em cloud (AWS, Azure, ou GCP)
- Configurar monitoramento e alerting
- Implementar testes de carga (k6)

---

**Última atualização:** Setembro 2026  
**Autor:** Andressa Lessa  
**Objetivo:** PDI - Demonstração de conhecimento em arquitetura de microsserviços
