# Observações e Sugestões de Arquitetura

> **Objetivo:** Este documento registra pontos fortes, inconsistências detectadas e sugestões de evolução arquitetural do Banking Services, seguindo boas práticas de mercado.

---

## ✅ Pontos Fortes da Implementação Atual

### 1. Value Objects bem desenhados
- `Money`, `AccountHolder`, `BankIdentity`, `Payee`, `PaymentDetails` seguem princípios de:
  - **Imutabilidade:** State não pode ser alterado após criação
  - **Encapsulamento:** Lógica de validação dentro do próprio VO
  - **Igualdade por valor:** Comparação por conteúdo, não por referência

### 2. Aggregates com invariantes claras
- **DigitalAccount:** Protege integridade de saldo (balance >= reservedBalance >= 0)
- **Expense:** Protege fluxo de aprovação (alçada mínima, decisões únicas)
- **Boundary bem definido:** Cada AR controla suas próprias regras

### 3. Separação de responsabilidades
- Bounded Contexts isolados corretamente:
  - Payment **não** importa entidades internas de Account
  - Account **não** importa entidades internas de Payment
- Comunicação via IDs e eventos (preparação para microsserviços)

### 4. Either para Use Cases
- Preparado para tratamento funcional de erros na camada de aplicação
- Evita exceções como fluxo de controle

### 5. Testes co-locados
- Alguns testes já seguem padrão correto:
  - `expense.spec.ts`, `money.spec.ts`, `approval.spec.ts`
- Facilita navegação e manutenção

---

## ⚠️ Inconsistências a Resolver

### 1. ExpenseApproval (Entidade Órfã)

**Status:** Definida em `src/modules/payment/domain/entities/expense-approval.ts` mas não utilizada.

**Conflito:** O AR Expense usa o VO `Approval` para gerenciar alçadas.

**Decisão necessária:**

#### Opção A: Remover ExpenseApproval (Recomendado)
- **Quando usar:** Sistema de alçada simples (contagem de aprovações)
- **Vantagens:**
  - Menos complexidade
  - VO é suficiente para encapsular lógica
  - Alinhado com a maioria dos sistemas bancários digitais

#### Opção B: Substituir VO Approval por Entidade ExpenseApproval
- **Quando usar:** Workflows complexos (alçadas hierárquicas, múltiplos níveis, aprovações sequenciais)
- **Vantagens:**
  - Permite evolução para workflows mais sofisticados
  - Entidade tem ciclo de vida próprio
- **Desvantagens:**
  - Maior complexidade
  - Overkill para o contexto atual

**Recomendação de mercado:** Para sistemas de alçada simples (como o atual), o VO é suficiente. Manter a implementação atual e remover `ExpenseApproval`.

---

### 2. accountId em Expense como string

**Status:** `accountId: string` deveria ser `accountId: UniqueEntityID`

**Impacto:**
- ❌ Fragilidade de tipo (string aceita qualquer valor)
- ❌ Dificulta refatoração futura
- ❌ Inconsistência com padrão de IDs do projeto

**Prioridade:** Alta

**Solução:**
```typescript
// ✅ Antes
accountId: string

// ✅ Depois
accountId: UniqueEntityID
```

---

### 3. Ciclo de Pagamento Incompleto (RF 05-07)

**Status:** Expense tem apenas `DRAFT | PAID | CANCELLED`

**Problema:** Requisitos funcionais RF 05-07 descrevem estados que não existem:
- ❌ `SCHEDULED` - Despesa agendada (saldo reservado)
- ❌ `IN_PROCESSING` - Em processamento na SCD
- ❌ `FAILED` - Falha no pagamento
- ❌ `REFUNDED` - Estornada

**Impacto:**
- Não é possível rastrear despesas em processamento
- Não há diferenciação entre falha e cancelamento
- Não há suporte a estorno

**Prioridade:** Média (depende de RF 05-07 serem priorizados)

**Solução:**
```typescript
enum ExpenseStatus {
  DRAFT = 'DRAFT',               // ✅ Existe
  SCHEDULED = 'SCHEDULED',       // ➕ Adicionar
  IN_PROCESSING = 'IN_PROCESSING', // ➕ Adicionar
  PAID = 'PAID',                 // ✅ Existe
  FAILED = 'FAILED',             // ➕ Adicionar
  CANCELLED = 'CANCELLED',       // ✅ Existe
  REFUNDED = 'REFUNDED',         // ➕ Adicionar
}
```

**Métodos a adicionar no AR Expense:**
```typescript
class Expense extends AggregateRoot<ExpenseProps> {
  // ➕ Novos métodos
  schedule(): void {
    // Validar: workflow APPROVED, status DRAFT
    // Ação: status → SCHEDULED
    // Evento: ExpenseScheduled
  }

  markAsProcessing(): void {
    // Validar: status SCHEDULED
    // Ação: status → IN_PROCESSING
  }

  markAsFailed(reason: string): void {
    // Validar: status IN_PROCESSING
    // Ação: status → FAILED
    // Evento: ExpenseFailed
  }

  refund(): void {
    // Validar: status PAID
    // Ação: status → REFUNDED
    // Evento: ExpenseRefunded
  }
}
```

---

### 4. Domain Events não emitidos

**Status:** Infraestrutura existe (`DomainEvents`, `AggregateRoot`), mas ARs não emitem eventos.

**Impacto:**
- ❌ Integração entre contextos bloqueada
- ❌ Não há auditoria de mudanças de estado
- ❌ Preparação incompleta para microsserviços

**Prioridade:** Alta (necessário para Fase 2)

**Solução:** Emitir eventos em todos os pontos de mutação críticos:

#### DigitalAccount
- `BalanceReserved` - Quando saldo é reservado
- `BalanceDebited` - Quando saldo é debitado
- `BalanceReleased` - Quando reserva é liberada
- `AccountStatusChanged` - Quando status muda

#### Expense
- `ExpenseCreated` - Quando despesa é criada
- `ExpenseApproved` - Quando alçada é atingida
- `ExpenseRejected` - Quando despesa é rejeitada
- `ExpenseScheduled` - Quando despesa é agendada
- `ExpensePaid` - Quando despesa é liquidada
- `ExpenseFailed` - Quando pagamento falha
- `ExpenseCancelled` - Quando despesa é cancelada
- `ExpenseRefunded` - Quando despesa é estornada

**Exemplo:**
```typescript
class DigitalAccount extends AggregateRoot<DigitalAccountProps> {
  reserveBalance(amount: Money): void {
    // ... validações ...
    this.props.reservedBalance = this.props.reservedBalance.add(amount);
    
    // ➕ Emitir evento
    this.addDomainEvent(new BalanceReservedEvent({
      aggregateId: this.id,
      accountId: this.id.toString(),
      amount: amount.toNumber(),
      occurredAt: new Date(),
    }));
  }
}
```

---

## 🏗️ Sugestões de Evolução Arquitetural

### 1. Application Services Layer (não implementada)

**O que é:** Camada que orquestra Use Cases e coordena operações entre contextos.

**Problema atual:**
- Use Cases acessam diretamente repositórios de outros contextos
- Acoplamento entre Bounded Contexts

**Solução:**
```typescript
// account-service/application/account-balance.service.ts
@Injectable()
export class AccountBalanceService {
  constructor(
    private accountRepo: AccountRepository,
    private eventPublisher: DomainEventPublisher,
  ) {}

  async reserve(accountId: string, amount: number): Promise<Either<Error, void>> {
    const account = await this.accountRepo.findById(accountId);
    if (!account) return left(new AccountNotFoundError());

    const amountVO = Money.fromNumber(amount);
    const result = account.reserveBalance(amountVO);
    if (result.isLeft()) return result;

    await this.accountRepo.save(account);
    await this.eventPublisher.publishAll(account.domainEvents);
    
    return right(undefined);
  }
}
```

**Benefício:**
- Payment não acessa diretamente repositórios de Account
- Reduz acoplamento
- Facilita migração para microsserviços

**Padrão de mercado:** Hexagonal Architecture (Ports & Adapters)

---

### 2. Validação de CNPJ no AccountHolder

**Status:** Não implementada

**Problema:** CNPJ pode ter formato inválido ou dígitos verificadores incorretos

**Solução:**
```typescript
class AccountHolder {
  private constructor(
    public readonly cnpj: string,
    public readonly legalName: string,
    public readonly tradeName: string,
  ) {}

  static create(props: AccountHolderProps): Either<Error, AccountHolder> {
    // Validar formato
    if (!this.isValidFormat(props.cnpj)) {
      return left(new InvalidCNPJFormatError());
    }

    // Validar dígitos verificadores
    if (!this.isValidCheckDigits(props.cnpj)) {
      return left(new InvalidCNPJCheckDigitsError());
    }

    return right(new AccountHolder(
      props.cnpj,
      props.legalName,
      props.tradeName,
    ));
  }

  private static isValidFormat(cnpj: string): boolean {
    return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj);
  }

  private static isValidCheckDigits(cnpj: string): boolean {
    // Algoritmo oficial de validação de CNPJ
    // https://www.geradorcnpj.com/algoritmo_do_cnpj.htm
  }
}
```

**Ferramenta:** Biblioteca `@fnando/cnpj` ou implementação própria

---

### 3. Validação de Chave PIX

**Status:** Não implementada

**Problema:** PaymentDetails não valida formato de chaves PIX

**Solução:**
```typescript
class PaymentDetailsPIX {
  static create(props: PIXProps): Either<Error, PaymentDetailsPIX> {
    const validation = this.validatePixKey(props.pixKey, props.pixKeyType);
    if (!validation.isValid) {
      return left(new InvalidPixKeyError(validation.reason));
    }

    return right(new PaymentDetailsPIX(props));
  }

  private static validatePixKey(key: string, type: PIXKeyType): ValidationResult {
    switch (type) {
      case 'CPF':
        return this.validateCPF(key);
      case 'CNPJ':
        return this.validateCNPJ(key);
      case 'EMAIL':
        return this.validateEmail(key);
      case 'PHONE':
        return this.validatePhone(key); // +55XXXXXXXXXXX
      case 'RANDOM':
        return this.validateUUID(key);
    }
  }
}
```

---

### 4. Money - Operações Adicionais

**Sugestão:** Adicionar operações matemáticas para cálculos financeiros

```typescript
class Money {
  // ✅ Existem
  add(other: Money): Money
  subtract(other: Money): Money

  // ➕ Adicionar
  multiply(factor: number): Money {
    // Cálculo de juros, taxas, multas
    // Ex: amount.multiply(1.05) // 5% de juros
  }

  divide(divisor: number): Money {
    // Rateio de valores
    // Ex: amount.divide(3) // Dividir entre 3 pessoas
  }

  percentage(percent: number): Money {
    // Calcular porcentagem
    // Ex: amount.percentage(10) // 10% do valor
  }
}
```

**Cuidado:** Garantir arredondamento correto
- **Padrão bancário:** Round half-even (banker's rounding)
- **Evitar:** Perda de precisão em operações sucessivas

---

### 5. Idempotência em Operações Críticas

**O que é:** Garantir que uma operação executada múltiplas vezes produz o mesmo resultado que se executada apenas uma vez.

**Por que:** Evitar duplicação em caso de retry/falha de rede.

**Onde aplicar:**
- Criação de despesa
- Agendamento de pagamento
- Liquidação de despesa

**Solução:**
```typescript
// expense.controller.ts
@Post()
async createExpense(
  @Body() dto: CreateExpenseDto,
  @Headers('idempotency-key') idempotencyKey?: string,
) {
  if (idempotencyKey) {
    const existing = await this.idempotencyService.findByKey(idempotencyKey);
    if (existing) {
      return existing.response; // ✅ Retornar resposta já processada
    }
  }

  const result = await this.createExpenseUseCase.execute(dto);

  if (idempotencyKey && result.isRight()) {
    await this.idempotencyService.store(idempotencyKey, result.value);
  }

  return result;
}
```

**Padrão de mercado:** Stripe, PagSeguro, PayPal (todos usam idempotency keys)

---

### 6. Auditoria e Compliance

**Consideração:** Sistemas financeiros são fortemente regulados (Banco Central do Brasil).

#### Event Sourcing (opcional, aumenta complexidade)
- **O que é:** Armazenar todas as mudanças de estado como eventos imutáveis
- **Vantagem:** Auditoria completa (rastreamento histórico)
- **Desvantagem:** Complexidade operacional (rebuild de estado)
- **Recomendação:** Considerar apenas se auditoria for requisito crítico

#### Logs de Auditoria (recomendado)
```typescript
@Injectable()
export class AuditLogger {
  async logStateChange(event: AuditEvent) {
    await this.auditRepo.save({
      entityId: event.entityId,
      entityType: event.entityType,
      action: event.action,             // 'STATUS_CHANGED', 'BALANCE_RESERVED', etc
      previousState: event.previousState,
      newState: event.newState,
      performedBy: event.userId,
      reason: event.reason,
      timestamp: new Date(),
      metadata: event.metadata,
    });
  }
}
```

#### Retenção de Dados
- **Legislação brasileira:** Dados financeiros devem ser mantidos por **5 anos**
- **Implementação:**
  - Soft delete (flag `deletedAt`)
  - Políticas de arquivamento (mover para storage frio após X anos)

---

### 7. Soft Delete para Despesas

**Recomendação:** Implementar soft delete ao invés de deleção física.

**Motivo:** Auditoria e compliance exigem rastreabilidade histórica.

```typescript
class Expense extends AggregateRoot<ExpenseProps> {
  deletedAt?: Date | null;

  delete(): void {
    if (this.props.status === ExpenseStatus.PAID) {
      throw new CannotDeletePaidExpenseError();
    }

    this.props.deletedAt = new Date();
    this.addDomainEvent(new ExpenseDeletedEvent({ ... }));
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }
}
```

**Queries:**
```typescript
// Repository
async findAll(): Promise<Expense[]> {
  return this.repo.find({
    where: { deletedAt: IsNull() }  // ✅ Ignorar deletados
  });
}

async findAllIncludingDeleted(): Promise<Expense[]> {
  return this.repo.find();  // Incluir deletados (auditoria)
}
```

---

### 8. Segregação de Status (Payment)

**Observação atual:** Expense tem apenas `status: ExpenseStatus`

**Problema:** Mistura status de aprovação com status de pagamento

**Sugestão de mercado:** Separar em dois status:

```typescript
class Expense extends AggregateRoot<ExpenseProps> {
  // ➕ Separar responsabilidades
  approvalStatus: ApprovalStatus;    // PENDING | APPROVED | REJECTED
  paymentStatus: PaymentStatus;      // DRAFT | SCHEDULED | IN_PROCESSING | PAID | FAILED | CANCELLED | REFUNDED
}

enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

enum PaymentStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  IN_PROCESSING = 'IN_PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}
```

**Benefícios:**
- ✅ Clareza de responsabilidades
- ✅ Alinhado com workflows reais de pagamento
- ✅ Facilita queries (filtrar por aprovação vs pagamento)

**Exemplo de workflow:**
```
approvalStatus: PENDING    | paymentStatus: DRAFT
approvalStatus: APPROVED   | paymentStatus: DRAFT
approvalStatus: APPROVED   | paymentStatus: SCHEDULED
approvalStatus: APPROVED   | paymentStatus: IN_PROCESSING
approvalStatus: APPROVED   | paymentStatus: PAID
```

---

## 🔐 Considerações de Segurança (futuro)

### 1. Encriptação de Dados Sensíveis

**Dados a encriptar:**
- Chaves PIX
- Dados bancários (`BankIdentity`)
- CNPJ (dados sensíveis segundo LGPD)

**Solução:**
```typescript
import { createCipheriv, createDecipheriv } from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = process.env.ENCRYPTION_KEY; // 32 bytes

  encrypt(plaintext: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
    // ... decipher ...
  }
}
```

---

### 2. Autenticação e Autorização

**OAuth2 + JWT:**
```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Validar JWT
    if (!user) return false;

    // Validar permissões (RBAC)
    const requiredRole = this.reflector.get<string>('role', context.getHandler());
    return user.role === requiredRole;
  }
}

// Uso
@Post(':id/approve')
@Roles('ADMIN')  // ✅ Apenas ADMINs podem aprovar
async approve(@Param('id') id: string) { }
```

---

### 3. Rate Limiting

**Essencial para APIs de pagamento:**
```typescript
// main.ts
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,           // 60 segundos
      limit: 100,        // 100 requisições
    }),
  ],
})
export class AppModule {}

// expense.controller.ts
@UseGuards(ThrottlerGuard)
@Controller('expenses')
export class ExpenseController { }
```

---

### 4. Validação de Entrada Rigorosa

**Sanitizar e validar todos os inputs:**
```typescript
// create-expense.dto.ts
import { IsString, IsNumber, IsEnum, Min, MaxLength } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @MaxLength(100)
  accountId: string;

  @IsNumber()
  @Min(0.01)  // ✅ Valor mínimo
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsString()
  @MaxLength(200)
  payeeName: string;

  // ... validações específicas por método de pagamento
}
```

---

## 📊 Observabilidade e Monitoramento (futuro)

### 1. Logging Estruturado

**Winston ou Pino com logs em JSON:**
```typescript
import pino from 'pino';

const logger = pino({
  level: 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

logger.info({
  action: 'balance_reserved',
  accountId: '123',
  amount: 100.50,
  requestId: 'uuid-123',
  timestamp: new Date().toISOString(),
});
```

**Benefício:** Facilita busca em ferramentas (ELK, Datadog, Loki)

---

### 2. Métricas de Negócio

**Exemplos:**
- Total de despesas criadas/aprovadas/rejeitadas por dia
- Tempo médio de aprovação
- Taxa de falha de pagamentos
- Saldo total em contas ativas

```typescript
import { Counter, Histogram } from 'prom-client';

const expenseCreatedCounter = new Counter({
  name: 'expense_created_total',
  help: 'Total de despesas criadas',
  labelNames: ['status', 'method'],
});

const approvalDuration = new Histogram({
  name: 'expense_approval_duration_seconds',
  help: 'Tempo de aprovação de despesas',
  buckets: [60, 300, 600, 1800, 3600], // 1min, 5min, 10min, 30min, 1h
});
```

---

### 3. Tracing Distribuído

**OpenTelemetry para rastrear fluxos:**
```
Request ID: abc-123
├─ Payment Service: Create Expense (50ms)
├─ Account Service: Check Balance (20ms)
├─ Payment Service: Save to DB (30ms)
└─ RabbitMQ: Publish ExpenseCreated (10ms)
Total: 110ms
```

---

### 4. Alerting

**Alertas críticos:**
- ❌ Falhas de pagamento consecutivas (> 5 em 10min)
- ❌ Saldo negativo (inconsistência crítica)
- ❌ Timeout em workflows Temporal (> 5min)
- ❌ Circuit breakers abertos (> 1min)

---

## 🧪 Estratégia de Testes (complementar)

### 1. Testes de Mutação (Stryker)
- Validar qualidade dos testes unitários
- Garantir que testes realmente cobrem lógica

### 2. Testes de Carga (k6 ou Artillery)
- Simular volume de transações
- Identificar bottlenecks de performance

### 3. Testes de Contrato (Pact)
- Garantir compatibilidade de eventos entre Account e Payment
- Evitar quebra de contratos na migração para microsserviços

### 4. Testes de Caos (Chaos Monkey)
- Validar resiliência em falhas:
  - RabbitMQ offline
  - PostgreSQL com alta latência
  - Temporal.io inacessível

---

## 📚 Referências

### Domain-Driven Design
- **DDD Tático:** Vaughn Vernon, "Implementing Domain-Driven Design"
- **Aggregate Design:** Vaughn Vernon, "Effective Aggregate Design" (série de artigos)
- **DDD Fundamentals:** Eric Evans, "Domain-Driven Design: Tackling Complexity in the Heart of Software"

### Clean Architecture
- **Robert C. Martin** - "Clean Architecture" (2017)
- **Hexagonal Architecture** - Alistair Cockburn

### Segurança
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **LGPD:** Lei 13.709/2018
- **BC Cibersegurança:** Resolução CMN 4.658/2018

### Observabilidade
- **"Distributed Systems Observability"** - Cindy Sridharan
- **OpenTelemetry Docs:** https://opentelemetry.io/

### Compliance Brasil
- **PIX - Regulamentação BC:** https://www.bcb.gov.br/estabilidadefinanceira/pix
- **Retenção de Dados:** 5 anos (legislação bancária)

---

**Última atualização:** Setembro 2026
