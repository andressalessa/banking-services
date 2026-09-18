# Glossário de Termos Técnicos

> Definições de conceitos, padrões e tecnologias utilizados no projeto Banking Services.

---

## 🏛️ Arquitetura e Design

### Aggregate Root (AR)
**Definição:** Entidade raiz de um agregado em DDD. Controla o acesso e mantém invariantes de todas as entidades dentro do agregado.

**Exemplo no projeto:** `DigitalAccount`, `Expense`

**Referência:** Eric Evans, "Domain-Driven Design" (2003)

---

### API Gateway
**Definição:** Ponto único de entrada para clientes externos em arquitetura de microsserviços. Centraliza cross-cutting concerns (autenticação, rate limiting, logging).

**Padrão:** Gateway Routing, Gateway Aggregation, Gateway Offloading

**Tecnologias:** Kong, NGINX, AWS API Gateway

**Referência:** Chris Richardson, "Microservices Patterns" (2018)

---

### Bounded Context
**Definição:** Limite explícito onde um modelo de domínio se aplica. Dentro do contexto, todos os termos têm significado específico e consistente.

**Exemplo no projeto:** 
- **Account Context:** DigitalAccount, Member, Balance
- **Payment Context:** Expense, Approval, Payee

**Referência:** Eric Evans, "Domain-Driven Design" (2003)

---

### Clean Architecture
**Definição:** Arquitetura em camadas onde dependências apontam para dentro (Dependency Rule). Domínio é independente de frameworks.

**Camadas:**
1. **Domain** (Entities, VOs, ARs)
2. **Application** (Use Cases)
3. **Infrastructure** (HTTP, DB, Messaging)

**Referência:** Robert C. Martin, "Clean Architecture" (2017)

---

### Domain-Driven Design (DDD)
**Definição:** Abordagem de design de software focada no domínio de negócio e na colaboração entre especialistas de domínio e desenvolvedores.

**Conceitos principais:**
- Ubiquitous Language
- Bounded Contexts
- Aggregates
- Entities e Value Objects
- Domain Events

**Referência:** Eric Evans, "Domain-Driven Design" (2003)

---

### Domain Events
**Definição:** Eventos que representam algo que aconteceu no domínio e é relevante para o negócio.

**Exemplo no projeto:**
- `BalanceReservedEvent`
- `ExpenseApprovedEvent`
- `ExpensePaidEvent`

**Uso:** Comunicação entre Bounded Contexts (Event-Driven Architecture)

---

### Either Pattern
**Definição:** Padrão funcional para representar resultado de operação: `Either<Left, Right>`. Por convenção, `Left` é erro e `Right` é sucesso.

**Exemplo:**
```typescript
type Either<L, R> = Left<L> | Right<R>

// Uso
const result: Either<Error, Account> = createAccount(data);
if (result.isLeft()) {
  // Tratar erro
} else {
  // Sucesso
}
```

**Benefício:** Tratamento explícito de erros (alternativa a exceções)

---

### Entity
**Definição:** Objeto com identidade única que persiste ao longo do tempo, mesmo que seus atributos mudem.

**Exemplo no projeto:** `Member` (tem ID único)

**Diferença de Value Object:** VOs não têm identidade (são definidos por seus valores)

---

### Modular Monolith
**Definição:** Monólito organizado em módulos estritamente isolados, preparado para extração em microsserviços.

**Benefícios:**
- Simplicidade inicial (um deploy)
- Performance (in-process)
- Preparação para microsserviços (módulos isolados)

**Referência:** Simon Brown, "Modular Monoliths" (2019)

---

### Shared Kernel
**Definição:** Pequeno conjunto de código compartilhado entre Bounded Contexts (ex.: `Entity`, `Money`, `UniqueEntityID`).

**Regra:** Manter mínimo para evitar acoplamento.

**Exemplo no projeto:** `src/core/`

---

### Value Object (VO)
**Definição:** Objeto imutável definido por seus valores (não tem identidade única).

**Exemplo no projeto:** `Money`, `AccountHolder`, `Payee`, `PaymentDetails`

**Características:**
- Imutável
- Igualdade por valor
- Sem identidade

---

## 🔄 Microsserviços

### Circuit Breaker
**Definição:** Padrão de resiliência que previne chamadas repetidas a serviço falhando.

**Estados:**
- **CLOSED:** Requisições passam normalmente
- **OPEN:** Falha rápida (sem chamar serviço)
- **HALF_OPEN:** Tenta novamente após timeout

**Biblioteca:** Opossum (Node.js), Resilience4j (Java)

**Referência:** Martin Fowler, "CircuitBreaker" (2014)

---

### Database per Service
**Definição:** Cada microsserviço tem seu próprio banco de dados (schema ou instância separada).

**Benefícios:**
- Acoplamento zero via schema
- Evolução independente de dados
- Tecnologia de DB diferente por serviço (poliglot persistence)

**Trade-off:** Perde transações ACID distribuídas; precisa de Sagas

**Referência:** Chris Richardson, "Microservices Patterns" (2018)

---

### Event-Driven Architecture (EDA)
**Definição:** Arquitetura onde serviços comunicam via eventos assíncronos.

**Padrões:**
- **Event Notification:** Notificar mudança de estado
- **Event-Carried State Transfer:** Evento carrega dados completos
- **Event Sourcing:** Estado é reconstruído a partir de eventos

**Tecnologias:** RabbitMQ, Kafka, AWS SNS/SQS

**Referência:** Martin Fowler, "What do you mean by Event-Driven?" (2017)

---

### Eventual Consistency
**Definição:** Modelo de consistência onde, após um período sem atualizações, todos os nós convergem para o mesmo estado.

**Uso:** Microsserviços com bancos separados (não há transação ACID distribuída)

**Exemplo:** Payment copia `accountStatus`; atualizado via evento `account.status.changed`

**Referência:** Werner Vogels, "Eventually Consistent" (2008)

---

### Saga Pattern
**Definição:** Padrão para gerenciar transações distribuídas através de sequência de transações locais com compensações.

**Tipos:**
- **Orquestrada:** Coordenador central (ex.: Temporal.io)
- **Coreografada:** Cada serviço publica/consome eventos

**Exemplo no projeto:**
```
SchedulePayment Saga:
1. Reserve saldo (Account)
2. Crie despesa (Payment)
3. Envie para SCD
4. Confirme débito (Account)
5. Marque como PAID (Payment)

Compensações (se falhar):
- Libere saldo
- Cancele despesa
```

**Referência:** Chris Richardson, "Saga Pattern" (2018)

---

### Service Discovery
**Definição:** Mecanismo para serviços encontrarem uns aos outros dinamicamente.

**Padrões:**
- **Client-side discovery:** Cliente consulta registry (Consul, Eureka)
- **Server-side discovery:** Load balancer consulta registry (Kubernetes DNS)

**Tecnologias:** Consul, Eureka, Kubernetes, AWS Cloud Map

---

### Strangler Fig Pattern
**Definição:** Migração incremental onde novo sistema "estrangula" o legado até substituí-lo completamente.

**Etapas:**
1. Criar novo serviço
2. Rotear tráfego para novo serviço (via proxy)
3. Monólito delega para novo serviço
4. Remover código do monólito
5. Repetir até desligar monólito

**Referência:** Martin Fowler, "StranglerFigApplication" (2004)

---

## 🛡️ Resiliência

### Bulkhead
**Definição:** Isolar recursos (thread pools, conexões) para evitar que falha em uma área derrube todo o sistema.

**Analogia:** Compartimentos de navio (bulkheads) impedem navio afundar se um compartimento alagar.

**Exemplo:** Thread pool separado para chamadas a Account Service

**Referência:** Michael T. Nygard, "Release It!" (2018)

---

### Idempotência
**Definição:** Operação que pode ser executada múltiplas vezes com mesmo resultado.

**Exemplo:** 
```
POST /expenses (idempotency-key: uuid123)
Executar 3x → apenas 1 despesa criada
```

**Implementação:** Tabela `processed_requests(idempotency_key, response)`

**Benefício:** Retry seguro (em falhas de rede)

---

### Retry com Backoff Exponencial
**Definição:** Tentar operação novamente com delay crescente exponencialmente.

**Exemplo:**
```
Tentativa 1: imediato
Tentativa 2: 1s depois
Tentativa 3: 2s depois (2^1)
Tentativa 4: 4s depois (2^2)
Tentativa 5: 8s depois (2^3)
```

**Benefício:** Evita sobrecarregar serviço falhando (backpressure)

---

### Timeout
**Definição:** Limite de tempo para operação completar; após isso, falha.

**Exemplo:**
```typescript
axios.post(url, data, { timeout: 5000 }); // 5 segundos
```

**Benefício:** Evita espera infinita; libera recursos rapidamente

---

## 📊 Observabilidade

### Distributed Tracing
**Definição:** Rastreamento de requisição através de múltiplos serviços.

**Componentes:**
- **Trace:** Jornada completa de uma requisição
- **Span:** Unidade de trabalho dentro do trace (ex.: chamada HTTP)
- **Trace ID:** Identificador único propagado entre serviços

**Tecnologias:** OpenTelemetry, Jaeger, Zipkin

**Referência:** Cindy Sridharan, "Distributed Systems Observability" (2018)

---

### Logging Estruturado
**Definição:** Logs em formato estruturado (JSON) para facilitar busca e análise.

**Exemplo:**
```json
{
  "timestamp": "2024-09-17T22:30:00Z",
  "level": "info",
  "message": "Balance reserved",
  "accountId": "123",
  "amount": 100.50,
  "requestId": "abc-456",
  "traceId": "xyz-789"
}
```

**Benefício:** Busca por campo (ex.: `accountId:123`) em ELK Stack

---

### RED Metrics
**Definição:** Três métricas essenciais para monitorar serviços:
- **Rate:** Requisições por segundo
- **Errors:** Taxa de erro (%)
- **Duration:** Latência (P50, P95, P99)

**Tecnologias:** Prometheus, Grafana

**Referência:** Tom Wilkie, "The RED Method" (2018)

---

### Three Pillars of Observability
**Definição:** Três pilares fundamentais:
1. **Logs:** O que aconteceu?
2. **Metrics:** Quantas vezes? Com que frequência?
3. **Traces:** Onde está o gargalo?

**Ferramentas:**
- Logs: ELK Stack, Loki
- Metrics: Prometheus, Grafana
- Traces: Jaeger, Zipkin

---

## 🔧 Tecnologias

### NestJS
**Definição:** Framework Node.js progressivo para construir aplicações server-side escaláveis.

**Características:**
- TypeScript nativo
- Arquitetura modular
- Dependency Injection
- Inspirado em Angular

**Site:** https://nestjs.com/

---

### PostgreSQL
**Definição:** Banco de dados relacional open source, robusto e com suporte a tipos avançados.

**Uso no projeto:** Valores monetários em `NUMERIC(15, 2)` (precisão decimal)

**Site:** https://www.postgresql.org/

---

### RabbitMQ
**Definição:** Message broker open source que implementa AMQP (Advanced Message Queuing Protocol).

**Conceitos:**
- **Exchange:** Roteador de mensagens (topic, direct, fanout)
- **Queue:** Fila de mensagens
- **Binding:** Regra de roteamento (exchange → queue)

**Site:** https://www.rabbitmq.com/

---

### Temporal.io
**Definição:** Plataforma para orquestração de workflows e sagas distribuídas.

**Características:**
- Workflows como código (TypeScript, Go, Java)
- Resiliência nativa (retry, timeout)
- Compensating transactions
- Observabilidade (UI web)

**Uso no projeto:** Saga de pagamento (reserve → send SCD → confirm → paid)

**Site:** https://temporal.io/

---

## 📦 Padrões de Código

### Dependency Injection (DI)
**Definição:** Padrão onde dependências são fornecidas externamente (não instanciadas internamente).

**Exemplo:**
```typescript
// ❌ Sem DI
class PaymentService {
  private accountRepo = new AccountRepository();
}

// ✅ Com DI
class PaymentService {
  constructor(private accountRepo: AccountRepository) {}
}
```

**Benefício:** Testabilidade (mock de dependências)

---

### Repository Pattern
**Definição:** Abstração que encapsula acesso a dados (persistência).

**Exemplo:**
```typescript
interface ExpenseRepository {
  save(expense: Expense): Promise<void>;
  findById(id: string): Promise<Expense | null>;
}
```

**Benefício:** Domínio independente de ORM/banco

---

### Use Case Pattern
**Definição:** Classe que encapsula lógica de um caso de uso específico.

**Exemplo:**
```typescript
class CreateExpenseUseCase {
  execute(data: CreateExpenseDTO): Either<Error, Expense> {
    // Validar, criar Expense, persistir
  }
}
```

**Benefício:** Single Responsibility Principle (um caso de uso por classe)

---

## 📚 Acrônimos

- **AR:** Aggregate Root
- **BC:** Bounded Context
- **DDD:** Domain-Driven Design
- **DI:** Dependency Injection
- **DTO:** Data Transfer Object
- **EDA:** Event-Driven Architecture
- **ORM:** Object-Relational Mapping
- **SCD:** Sistema de Contas Digitais (gateway externo no projeto)
- **SOLID:** Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion
- **VO:** Value Object

---

## 🔗 Referências Completas

### Livros Fundamentais

1. **Eric Evans** — "Domain-Driven Design: Tackling Complexity in the Heart of Software" (2003)
2. **Vaughn Vernon** — "Implementing Domain-Driven Design" (2013)
3. **Robert C. Martin** — "Clean Architecture: A Craftsman's Guide to Software Structure and Design" (2017)
4. **Sam Newman** — "Building Microservices: Designing Fine-Grained Systems" (2ª ed, 2021)
5. **Chris Richardson** — "Microservices Patterns: With examples in Java" (2018)
6. **Michael T. Nygard** — "Release It! Design and Deploy Production-Ready Software" (2ª ed, 2018)
7. **Martin Kleppmann** — "Designing Data-Intensive Applications" (2017)

### Artigos Clássicos

- **Martin Fowler** — "StranglerFigApplication" (2004)
- **Martin Fowler** — "CircuitBreaker" (2014)
- **Martin Fowler** — "What do you mean by Event-Driven?" (2017)
- **Werner Vogels** — "Eventually Consistent" (2008)
- **Pat Helland** — "Life beyond Distributed Transactions: an Apostate's Opinion" (2007)

### Sites de Referência

- **Microservices.io:** https://microservices.io/ (catálogo de padrões)
- **Martin Fowler's Blog:** https://martinfowler.com/
- **Temporal.io Docs:** https://docs.temporal.io/
- **OpenTelemetry:** https://opentelemetry.io/

---

**Última atualização:** Setembro 2026  
**Projeto:** Banking Services  
**Autor:** Andressa Lessa
