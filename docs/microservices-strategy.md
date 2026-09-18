# Estratégia de Migração para Microsserviços

> **Objetivo:** Este documento detalha a estratégia de evolução do Modular Monolith (Fase 1) para Arquitetura de Microsserviços (Fase 2), demonstrando conhecimento em decomposição de sistemas, comunicação distribuída e padrões de resiliência.

---

## 🎯 Motivação

### Por que começar com Modular Monolith?

1. **Simplicidade inicial:** Menos complexidade operacional (um deploy, um banco)
2. **Descoberta de Bounded Contexts:** DDD tático emerge naturalmente durante desenvolvimento
3. **Performance:** Comunicação in-process (sem latência de rede)
4. **Baixo custo:** Ideal para MVP e validação de negócio

### Por que migrar para Microsserviços?

1. **Escalabilidade independente:** Account e Payment podem escalar separadamente
2. **Autonomia de times:** Times diferentes podem evoluir cada serviço
3. **Resiliência:** Falha em Payment não derruba Account
4. **Deploy independente:** Hotfix em Account sem impactar Payment
5. **Demonstração de conhecimento (PDI):** Arquitetura moderna de sistemas distribuídos

---

## 🏗️ Arquitetura Alvo

### Topologia dos Serviços

```
                     ┌──────────────────────────────────┐
                     │         Cliente (Frontend)       │
                     └────────────────┬─────────────────┘
                                      │
                                      ▼
                     ┌──────────────────────────────────┐
                     │          API Gateway              │
                     │  - Autenticação (JWT)             │
                     │  - Rate Limiting                  │
                     │  - Request/Response Logging       │
                     │  - CORS                           │
                     └────────────┬─────────────┬────────┘
                                  │             │
                 ┌────────────────┘             └────────────────┐
                 ▼                                               ▼
    ┌────────────────────────┐                   ┌────────────────────────┐
    │   Account Service      │                   │   Payment Service      │
    │   Port: 3001           │◄─────REST─────────┤   Port: 3002           │
    │                        │                   │                        │
    │  Domínio:              │                   │  Domínio:              │
    │  - DigitalAccount (AR) │                   │  - Expense (AR)        │
    │  - Member (E)          │                   │  - Approval (VO)       │
    │  - Balance Management  │                   │  - Payment Workflow    │
    │                        │                   │                        │
    │  APIs:                 │                   │  APIs:                 │
    │  - Create Account      │                   │  - Create Expense      │
    │  - Change Status       │                   │  - Approve/Reject      │
    │  - Reserve Balance     │                   │  - Schedule Payment    │
    │  - Release Balance     │                   │  - Settle/Cancel       │
    │  - Confirm Debit       │                   │                        │
    └────────┬───────────────┘                   └────────┬───────────────┘
             │                                            │
             │ Publica Eventos                            │ Publica Eventos
             │ - balance.reserved                         │ - expense.scheduled
             │ - balance.debited                          │ - expense.paid
             │ - status.changed                           │ - expense.cancelled
             │                                            │
             └─────────────┬──────────────────────────────┘
                           ▼
              ┌────────────────────────┐
              │       RabbitMQ         │
              │   (Message Broker)     │
              │                        │
              │  Exchanges:            │
              │  - account.events      │
              │  - payment.events      │
              │                        │
              │  Queues:               │
              │  - payment.account-dlq │
              │  - account.payment-dlq │
              └────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │      Temporal.io       │
              │   (Saga Orchestrator)  │
              │                        │
              │  Workflows:            │
              │  - SchedulePayment     │
              │  - RefundPayment       │
              │                        │
              │  Workers:              │
              │  - account-worker      │
              │  - payment-worker      │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │          SCD           │
              │  (External Gateway)    │
              │  - PIX                 │
              │  - Boleto              │
              │  - TED                 │
              └────────────────────────┘

  ┌─────────────────────┐           ┌─────────────────────┐
  │   PostgreSQL        │           │   PostgreSQL        │
  │   account_db        │           │   payment_db        │
  │                     │           │                     │
  │  Tables:            │           │  Tables:            │
  │  - accounts         │           │  - expenses         │
  │  - members          │           │  - approvals        │
  │  - processed_events │           │  - processed_events │
  └─────────────────────┘           └─────────────────────┘
```

---

## 📋 Passo a Passo da Migração

### Etapa 0: Pré-requisitos (Fase 1 completa)

✅ Bounded Contexts isolados (Account e Payment)  
✅ Comunicação via interfaces/eventos (não acoplamento direto)  
✅ Core compartilhado (Entity, AggregateRoot, Money, Either)  
✅ Domain Events implementados e funcionando  
✅ Use Cases retornam `Either<Error, Result>`  

---

### Etapa 1: Separar Bancos de Dados (Database per Service)

#### 1.1. Criar Schemas Separados

```sql
-- PostgreSQL: múltiplos schemas no mesmo servidor (início)
CREATE SCHEMA account_service;
CREATE SCHEMA payment_service;

-- Migrar tabelas
ALTER TABLE accounts SET SCHEMA account_service;
ALTER TABLE members SET SCHEMA account_service;

ALTER TABLE expenses SET SCHEMA payment_service;
ALTER TABLE expense_approval_decisions SET SCHEMA payment_service;
```

#### 1.2. Configurar Conexões Separadas

```typescript
// account-service: database.module.ts
TypeOrmModule.forRoot({
  schema: 'account_service',
  entities: [AccountEntity, MemberEntity],
  // ...
})

// payment-service: database.module.ts
TypeOrmModule.forRoot({
  schema: 'payment_service',
  entities: [ExpenseEntity, ApprovalEntity],
  // ...
})
```

#### 1.3. Eliminar Joins entre Contextos

❌ **Antes (Monólito):**
```typescript
// Possível fazer JOIN entre Account e Payment
const result = await this.db.query(`
  SELECT e.*, a.balance 
  FROM expenses e 
  JOIN accounts a ON e.accountId = a.id
`);
```

✅ **Depois (Microsserviços):**
```typescript
// Payment Service: consultar Account via API
const expense = await this.expenseRepo.findById(id);
const account = await this.accountClient.getAccount(expense.accountId);
```

---

### Etapa 2: Extrair Account Service

#### 2.1. Criar Repositório Separado

```bash
mkdir account-service
cd account-service
nest new . --package-manager npm
```

#### 2.2. Copiar Código Relevante

```
account-service/
├── src/
│   ├── core/                    # Copiar de src/core
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── either.ts
│   │   └── events/
│   ├── domain/                  # Copiar de src/modules/account/domain
│   │   ├── entities/
│   │   │   ├── digital-account.ts
│   │   │   └── member.ts
│   │   ├── value-objects/
│   │   └── enums/
│   ├── application/             # Use Cases
│   │   ├── create-account.usecase.ts
│   │   ├── reserve-balance.usecase.ts
│   │   └── ...
│   ├── infrastructure/          # HTTP, DB, Events
│   │   ├── http/
│   │   │   └── account.controller.ts
│   │   ├── persistence/
│   │   │   └── account.repository.ts
│   │   └── events/
│   │       └── domain-event.publisher.ts
│   └── main.ts
└── docker-compose.yml
```

#### 2.3. Expor APIs REST

```typescript
// account.controller.ts
@Controller('api/v1/accounts')
export class AccountController {
  @Post()
  async create(@Body() dto: CreateAccountDto) {
    const result = await this.createAccountUseCase.execute(dto);
    // Mapear Either<Error, Account> -> HTTP Response
  }

  @Post(':id/balance/reserve')
  async reserveBalance(
    @Param('id') id: string,
    @Body() dto: ReserveBalanceDto
  ) {
    const result = await this.reserveBalanceUseCase.execute(id, dto.amount);
    // Retornar 200 OK ou 422 Unprocessable Entity
  }

  @Post(':id/balance/release')
  async releaseBalance(@Param('id') id: string, @Body() dto: ReleaseBalanceDto) { }

  @Post(':id/balance/debit')
  async confirmDebit(@Param('id') id: string, @Body() dto: ConfirmDebitDto) { }
}
```

#### 2.4. Publicar Eventos no RabbitMQ

```typescript
// domain-event.publisher.ts
@Injectable()
export class DomainEventPublisher {
  constructor(private amqp: AmqpConnection) {}

  async publishBalanceReserved(event: BalanceReservedEvent) {
    await this.amqp.publish(
      'account.events',              // Exchange
      'account.balance.reserved',    // Routing key
      {
        eventId: event.id,
        accountId: event.accountId,
        amount: event.amount,
        timestamp: event.occurredAt,
      }
    );
  }
}
```

#### 2.5. Configurar Docker Compose

```yaml
# account-service/docker-compose.yml
services:
  account-service:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgres://user:pass@postgres/banking?schema=account_service
      RABBITMQ_URL: amqp://rabbitmq:5672
    depends_on:
      - postgres
      - rabbitmq

  postgres:
    image: postgres:15-alpine
    volumes:
      - account-data:/var/lib/postgresql/data

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
```

---

### Etapa 3: Extrair Payment Service

#### 3.1. Estrutura Similar ao Account Service

```
payment-service/
├── src/
│   ├── core/                    # Copiar de src/core
│   ├── domain/                  # Copiar de src/modules/payment/domain
│   ├── application/             # Use Cases
│   ├── infrastructure/
│   │   ├── http/
│   │   │   └── expense.controller.ts
│   │   ├── persistence/
│   │   ├── events/
│   │   │   └── account-event.subscriber.ts
│   │   └── clients/
│   │       └── account.client.ts     # HTTP client para Account Service
│   └── main.ts
```

#### 3.2. Criar Cliente HTTP para Account Service

```typescript
// account.client.ts
@Injectable()
export class AccountClient {
  constructor(
    private httpService: HttpService,
    @Inject('ACCOUNT_SERVICE_URL') private accountUrl: string
  ) {}

  async reserveBalance(accountId: string, amount: number): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.accountUrl}/api/v1/accounts/${accountId}/balance/reserve`,
          { amount },
          { timeout: 5000 }  // Timeout de 5s
        )
      );
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new AccountServiceTimeoutError();
      }
      throw new AccountServiceUnavailableError();
    }
  }
}
```

#### 3.3. Implementar Circuit Breaker (Resiliência)

```typescript
// account.client.ts (com Resilience)
import * as circuitBreaker from 'opossum';

@Injectable()
export class AccountClient {
  private breaker: circuitBreaker;

  constructor(private httpService: HttpService) {
    this.breaker = new circuitBreaker(
      (accountId: string, amount: number) => this.reserveBalanceRaw(accountId, amount),
      {
        timeout: 5000,              // 5s timeout
        errorThresholdPercentage: 50,  // Abrir circuito se 50% falharem
        resetTimeout: 30000,        // Tentar fechar após 30s
      }
    );
  }

  async reserveBalance(accountId: string, amount: number): Promise<void> {
    return this.breaker.fire(accountId, amount);
  }

  private async reserveBalanceRaw(accountId: string, amount: number) {
    // Lógica de HTTP request
  }
}
```

#### 3.4. Consumir Eventos de Account

```typescript
// account-event.subscriber.ts
@Injectable()
export class AccountEventSubscriber {
  @RabbitSubscribe({
    exchange: 'account.events',
    routingKey: 'account.status.changed',
    queue: 'payment.account-status',
  })
  async handleAccountStatusChanged(msg: AccountStatusChangedEvent) {
    // Atualizar cache local de status de conta (se necessário)
    await this.accountCacheService.updateStatus(msg.accountId, msg.newStatus);
  }
}
```

---

### Etapa 4: Implementar API Gateway

#### 4.1. Escolher Solução

**Opções:**
- **Kong** (open source, Lua, plugins ricos)
- **NGINX** (reverse proxy, leve)
- **AWS API Gateway** (managed, cloud)
- **NestJS Gateway** (custom, TypeScript)

**Escolha para este projeto:** NGINX (simples, performático)

#### 4.2. Configurar Roteamento

```nginx
# nginx.conf
upstream account_service {
    server account-service:3001;
}

upstream payment_service {
    server payment-service:3002;
}

server {
    listen 80;

    location /api/v1/accounts {
        proxy_pass http://account_service;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }

    location /api/v1/expenses {
        proxy_pass http://payment_service;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }

    # Health checks
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

#### 4.3. Adicionar Rate Limiting

```nginx
# Limitar a 100 req/s por IP
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;

server {
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        # ... proxy_pass ...
    }
}
```

---

### Etapa 5: Configurar Temporal.io para Sagas Distribuídas

#### 5.1. Workflow: SchedulePayment (Saga)

```typescript
// payment-service/workflows/schedule-payment.workflow.ts
import { proxyActivities } from '@temporalio/workflow';

const { reserveBalance, createExpenseInDB, sendToSCD, confirmDebit, markAsPaid } =
  proxyActivities({
    startToCloseTimeout: '1 minute',
    retry: { maximumAttempts: 3 },
  });

export async function schedulePaymentWorkflow(input: SchedulePaymentInput): Promise<void> {
  let balanceReserved = false;
  let sentToSCD = false;

  try {
    // 1. Reservar saldo na Account
    await reserveBalance({ accountId: input.accountId, amount: input.amount });
    balanceReserved = true;

    // 2. Criar despesa no DB (estado SCHEDULED)
    await createExpenseInDB(input);

    // 3. Enviar para SCD
    const scdResponse = await sendToSCD(input);
    sentToSCD = true;

    // 4. Aguardar liquidação (polling ou signal)
    // ... aguardar retorno SCD ...

    // 5. Confirmar débito na Account
    await confirmDebit({ accountId: input.accountId, amount: input.amount });

    // 6. Marcar despesa como PAID
    await markAsPaid(input.expenseId);

  } catch (error) {
    // Compensações (Saga rollback)
    if (sentToSCD) {
      await cancelInSCD(input.expenseId);
    }
    if (balanceReserved) {
      await releaseBalance({ accountId: input.accountId, amount: input.amount });
    }
    await markAsFailed(input.expenseId, error.message);
    throw error;
  }
}
```

#### 5.2. Configurar Workers

```typescript
// account-service/temporal/worker.ts
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'account-queue',
  });

  await worker.run();
}

run().catch((err) => console.error(err));
```

---

### Etapa 6: Observabilidade Distribuída

#### 6.1. Distributed Tracing (OpenTelemetry + Jaeger)

```typescript
// account-service/main.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: 'http://jaeger:14268/api/traces',
  }),
  serviceName: 'account-service',
});

sdk.start();
```

**Benefício:** Rastrear uma requisição desde o API Gateway → Payment → Account → SCD

#### 6.2. Métricas (Prometheus + Grafana)

```typescript
// account-service/metrics.ts
import { Counter, Histogram, register } from 'prom-client';

export const balanceReserveCounter = new Counter({
  name: 'account_balance_reserve_total',
  help: 'Total de reservas de saldo',
  labelNames: ['status'], // success, insufficient_balance
});

export const balanceReserveDuration = new Histogram({
  name: 'account_balance_reserve_duration_seconds',
  help: 'Duração das reservas de saldo',
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Expor métricas
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

**Dashboard Grafana:**
- Taxa de sucesso de reservas de saldo (%)
- Latência P50, P95, P99 de operações
- Taxa de circuit breakers abertos

#### 6.3. Logging Centralizado (ELK Stack)

```typescript
// shared/logger.ts
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: 'http://elasticsearch:9200' },
      index: 'banking-services',
    }),
  ],
});

// Uso
logger.info('Balance reserved', {
  accountId: '123',
  amount: 100.50,
  requestId: req.headers['x-request-id'],  // Correlação
});
```

---

## 🔒 Padrões de Resiliência

### 1. Circuit Breaker

**Problema:** Account Service está fora; Payment Service deve falhar rápido.

**Solução:** Abrir circuito após N falhas consecutivas.

```typescript
// Estados: CLOSED → OPEN → HALF_OPEN → CLOSED
if (circuitState === 'OPEN') {
  throw new ServiceUnavailableError('Account Service unreachable');
}
```

### 2. Retry com Backoff Exponencial

**Problema:** Falha transitória (timeout de rede).

**Solução:** Tentar novamente com delay crescente.

```typescript
// Tentativa 1: imediato
// Tentativa 2: 1s depois
// Tentativa 3: 2s depois
// Tentativa 4: 4s depois
await retry(() => this.accountClient.reserveBalance(id, amount), {
  maxAttempts: 4,
  backoff: 'exponential',
});
```

### 3. Timeout

**Problema:** Account Service trava; Payment não deve esperar infinitamente.

**Solução:** Definir timeout explícito (ex.: 5s).

```typescript
await axios.post(url, data, { timeout: 5000 });
```

### 4. Bulkhead

**Problema:** Falha em Account não deve consumir todos os threads de Payment.

**Solução:** Isolar recursos (thread pool separado para chamadas externas).

```typescript
// Usar thread pool dedicado para Account calls
const accountPool = new Semaphore(10);  // Máximo 10 chamadas concorrentes
```

---

## 📊 Vantagens Demonstradas (PDI)

### Conhecimentos Técnicos Aplicados

✅ **Decomposição de Sistemas:**
- Identificação de Bounded Contexts (DDD)
- Database per Service pattern
- Strangler Fig migration pattern

✅ **Comunicação Distribuída:**
- REST APIs com versionamento
- Event-Driven Architecture (RabbitMQ)
- Sagas orquestradas (Temporal.io)

✅ **Resiliência:**
- Circuit Breaker, Retry, Timeout
- Compensating transactions
- Idempotência (Event IDs)

✅ **Observabilidade:**
- Distributed Tracing (OpenTelemetry + Jaeger)
- Métricas de negócio (Prometheus)
- Logging centralizado (ELK Stack)

✅ **DevOps:**
- Containerização (Docker)
- Orquestração (Docker Compose / Kubernetes)
- CI/CD por serviço

✅ **Segurança:**
- API Gateway (autenticação centralizada)
- Rate Limiting
- Network isolation (service mesh opcional)

---

## 🚀 Cronograma Sugerido

| Etapa | Duração | Esforço Total |
|-------|---------|---------------|
| 1. Database per Service | 3-4h | 4h |
| 2. Extrair Account Service | 4-6h | 5h |
| 3. Extrair Payment Service | 4-6h | 5h |
| 4. API Gateway (NGINX) | 2-3h | 2.5h |
| 5. Temporal.io Sagas | 4-6h | 5h |
| 6. Observabilidade | 3-4h | 3.5h |
| 7. Testes de Integração | 2-3h | 2.5h |
| 8. Documentação | 1-2h | 1.5h |
| **Total** | | **~29h** |

---

## 📚 Referências Essenciais

### Livros
- **"Building Microservices"** — Sam Newman (2ª edição, 2021)
- **"Microservices Patterns"** — Chris Richardson (2018)
- **"Release It!"** — Michael T. Nygard (2ª edição, 2018)

### Artigos
- **Strangler Fig Pattern:** https://martinfowler.com/bliki/StranglerFigApplication.html
- **Saga Pattern:** https://microservices.io/patterns/data/saga.html
- **Circuit Breaker:** https://martinfowler.com/bliki/CircuitBreaker.html

### Documentação
- **Temporal.io:** https://docs.temporal.io/
- **RabbitMQ:** https://www.rabbitmq.com/documentation.html
- **OpenTelemetry:** https://opentelemetry.io/docs/

---

## ✅ Checklist para PDI

- [ ] Demonstrar decomposição de monólito em microsserviços
- [ ] Implementar comunicação REST com resiliência (Circuit Breaker)
- [ ] Implementar comunicação assíncrona (Event-Driven)
- [ ] Orquestrar saga distribuída com Temporal.io
- [ ] Configurar distributed tracing (Jaeger)
- [ ] Configurar métricas (Prometheus + Grafana)
- [ ] Criar diagramas de arquitetura (C4 Model)
- [ ] Documentar trade-offs e decisões arquiteturais
- [ ] Apresentar antes/depois (Monólito vs Microsserviços)
