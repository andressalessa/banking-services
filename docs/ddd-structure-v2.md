# Domain-Driven Design Structure

> **Objetivo:** Este documento descreve a estrutura de domínio do Banking Services, detalhando Bounded Contexts, Aggregates, Entities e Value Objects conforme princípios de DDD Tático.

---

## Bounded Contexts

### Account

**Responsabilidade:** Gerenciar contas digitais, membros aprovadores e operações de saldo.

**Componentes:**
- **Aggregate Root:** DigitalAccount
- **Entities:** Member
- **Value Objects:** AccountHolder, BankIdentity, Money (shared kernel)
- **Enums:** AccountStatus

### Payment

**Responsabilidade:** Gerenciar despesas, fluxo de aprovação e ciclo de pagamento.

**Componentes:**
- **Aggregate Root:** Expense
- **Value Objects:** Payee, PaymentDetails, Approval, Money (shared kernel)
- **Enums:** ExpenseStatus

---

## Aggregates (implementados)

### DigitalAccount (Aggregate Root)

**Localização:** `src/modules/account/domain/entities/digital-account.ts`

**Estrutura:**
```typescript
class DigitalAccount extends AggregateRoot<DigitalAccountProps> {
  id: UniqueEntityID
  holder: AccountHolder              // VO
  status: AccountStatus              // enum
  bankIdentity: BankIdentity         // VO
  balance: Money                     // VO (core)
  reservedBalance: Money             // VO (core)
  members: Member[]                  // Entity[]
  createdAt: Date
  updatedAt?: Date | null
}
```

**Invariantes Protegidas:**
- Pelo menos um membro ADMIN + ACTIVE (aprovador)
- Saldo disponível = balance - reservedBalance >= 0
- Operações de saldo apenas com conta ACTIVE

**Métodos:**
- `reserveBalance(amount: Money): void` - Reserva saldo para pagamento
- `releaseReservedBalance(amount: Money): void` - Libera reserva (cancelamento)
- `confirmDebit(amount: Money): void` - Confirma débito após liquidação
- `changeStatus(newStatus: AccountStatus): void` - Altera status da conta

---

### Member (Entity)

**Localização:** `src/modules/account/domain/entities/member.ts`

**Estrutura:**
```typescript
class Member extends Entity<MemberProps> {
  id: UniqueEntityID
  personId: string                   // Referência externa (PF)
  role: MemberRole                   // ADMIN | COLLABORATOR
  status: MemberStatus               // ACTIVE | INACTIVE
  createdAt: Date
}
```

**Regras:**
- ADMIN ativo pode aprovar despesas
- COLLABORATOR não é aprovador

---

### Expense (Aggregate Root)

**Localização:** `src/modules/payment/domain/entities/expense.ts`

**Estrutura:**
```typescript
class Expense extends AggregateRoot<ExpenseProps> {
  id: UniqueEntityID
  accountId: string                  
  payee: Payee                       // VO
  amount: Money                      // VO (core)
  paymentDetails: PaymentDetails     // VO (discriminated union)
  approval: Approval                 // VO
  status: ExpenseStatus              // enum: DRAFT | PAID | CANCELLED
  dueDate: Date
  paidAt?: Date | null
  createdAt: Date
}
```

**Invariantes Protegidas:**
- Aprovação requer alçada mínima
- Não se cancela despesa já PAID
- Rejeição exige motivo

**Métodos:**
- `approve(approverPersonId: string): void` - Adiciona decisão de aprovação
- `reject(approverPersonId: string, reason: string): void` - Rejeita com motivo
- `markAsPaid(paidAt: Date): void` - Marca como paga
- `cancel(): void` - Cancela despesa

**Status Disponíveis (implementados):**
- `DRAFT` - Despesa criada, aguardando aprovação
- `PAID` - Despesa liquidada
- `CANCELLED` - Despesa cancelada

---- inicio feito ----
**⚠️ Status Pendentes (RF 05-07 não implementados):**
- `SCHEDULED` - Agendada para pagamento (saldo reservado)
- `IN_PROCESSING` - Em processamento na SCD
- `FAILED` - Falha no pagamento
- `REFUNDED` - Estornada

**⚠️ Métodos Pendentes:**
- `schedule(): void` - Agendar pagamento
- `refund(): void` - Estornar pagamento

---- fim feito ----

---

## Value Objects

### AccountHolder

**Localização:** `src/modules/account/domain/value-objects/account-holder.ts`

**Estrutura:**
```typescript
class AccountHolder {
  cnpj: string                       // ⚠️ TODO: validar formato e dígitos
  legalName: string
  tradeName: string
}
```

---

### BankIdentity

**Localização:** `src/modules/account/domain/value-objects/bank-identity.ts`

**Estrutura:**
```typescript
class BankIdentity {
  externalAccountId: string          // ID da SCD
  bankCode: string
  branch: string
  accountNumber: string
}
```

---

### Payee

**Localização:** `src/modules/payment/domain/value-objects/payee.ts`

**Estrutura:**
```typescript
class Payee {
  name: string
  taxId: string
  taxIdType: 'CPF' | 'CNPJ'
  email?: string
}
```

---

### PaymentDetails (Discriminated Union)

**Localização:** `src/modules/payment/domain/value-objects/payment-details.ts`

**Estrutura:**
```typescript
type PaymentDetails = 
  | PaymentDetailsPIX
  | PaymentDetailsBoleto
  | PaymentDetailsBankTransfer

interface PaymentDetailsPIX {
  method: 'PIX'
  pixKey: string
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'
}

interface PaymentDetailsBoleto {
  method: 'BOLETO'
  barCode: string
}

interface PaymentDetailsBankTransfer {
  method: 'BANK_TRANSFER'
  bankCode: string
  branch: string
  accountNumber: string
  accountType: 'CHECKING' | 'SAVINGS'
}
```

**✅ Validações Implementadas (Production-Grade - BACEN Compliant):**
- **CPF**: Validação completa de dígitos verificadores (algoritmo oficial da Receita Federal)
  - Rejeita CPFs conhecidos como inválidos (000.000.000-00, 111.111.111-11, etc)
  - Aceita formatação: `123.456.789-09` ou `12345678909`
- **CNPJ**: Validação completa de dígitos verificadores (algoritmo oficial da Receita Federal)
  - Rejeita CNPJs conhecidos como inválidos (00.000.000/0000-00, 11.111.111/1111-11, etc)
  - Aceita formatação: `11.222.333/0001-81` ou `11222333000181`
- **EMAIL**: RFC 5322 compliant + limite BACEN (máximo 77 caracteres)
  - Normalização: lowercase, trim
  - Validação robusta de formato
- **PHONE**: E.164 format (BACEN requirement)
  - Formato obrigatório: `+5511987654321` ou `+551133334444`
  - Validação de DDD (11-99)
  - Celular: 9 dígitos começando com 9
  - Fixo: 8 dígitos
- **RANDOM (EVP)**: UUID v4 válido

**Domain Errors Específicos:**
- `InvalidPixKeyCpfError`
- `InvalidPixKeyCnpjError`
- `InvalidPixKeyEmailError`
- `InvalidPixKeyPhoneError`
- `InvalidPixKeyRandomError`
- `EmptyPixKeyError`

---

### Approval (Value Object)

**Localização:** `src/modules/payment/domain/value-objects/approval.ts`

**Estrutura:**
```typescript
class Approval {
  requiredApprovalsCount: number
  decisions: ApprovalDecision[]
  workflowStatus: WorkflowStatus     // PENDING | APPROVED | REJECTED
}

interface ApprovalDecision {
  approverPersonId: string
  status: 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  createdAt: Date
}
```

**Regras:**
- Mesmo aprovador não decide duas vezes
- Workflow APPROVED quando `decisions.length >= requiredApprovalsCount`
- Workflow REJECTED se alguma decisão for REJECTED

---

### Money (Shared Kernel)

**Localização:** `src/core/value-objects/money.ts`

**Estrutura:**
```typescript
class Money {
  private readonly valueInCents: number   // Valor interno em centavos
  
  // Métodos
  add(other: Money): Money
  subtract(other: Money): Money
  isGreaterThan(other: Money): boolean
  isGreaterThanOrEqual(other: Money): boolean
  equals(other: Money): boolean
  toNumber(): number                      // Retorna valor em reais
}
```

**⚠️ Operações Pendentes:**
- `multiply(factor: number): Money` - Cálculo de juros/taxas
- `divide(divisor: number): Money` - Rateio
- Arredondamento bancário (round half-even)

---

## Enums

### AccountStatus

**Localização:** `src/modules/account/domain/enums/account-status.ts`

```typescript
enum AccountStatus {
  PENDING = 'PENDING',           // Aguardando validação
  VALIDATED = 'VALIDATED',       // Validada, aguardando ativação
  ACTIVE = 'ACTIVE',             // Ativa (operacional)
  BLOCKED = 'BLOCKED',           // Bloqueada temporariamente
  CLOSED = 'CLOSED',             // Encerrada (final)
}
```

**Transições Válidas:**
- PENDING → VALIDATED | CLOSED
- VALIDATED → ACTIVE | CLOSED
- ACTIVE → BLOCKED | CLOSED
- BLOCKED → ACTIVE | CLOSED
- CLOSED → ∅ (final)

---

### ExpenseStatus

**Localização:** `src/modules/payment/domain/enums/expense-status.ts`

```typescript
enum ExpenseStatus {
  DRAFT = 'DRAFT',               // ✅ Implementado
  PAID = 'PAID',                 // ✅ Implementado
  CANCELLED = 'CANCELLED',       // ✅ Implementado
  
  // ⚠️ Pendentes (RF 05-07)
  // SCHEDULED = 'SCHEDULED',
  // IN_PROCESSING = 'IN_PROCESSING',
  // FAILED = 'FAILED',
  // REFUNDED = 'REFUNDED',
}
```

---

## Entities Órfãs (não utilizadas)

### ExpenseApproval (⚠️ não utilizada)

**Localização:** `src/modules/payment/domain/entities/expense-approval.ts`

**Status:** Definida mas não utilizada pelo agregado Expense.

**Conflito:** O AR Expense usa o VO `Approval` para gerenciar alçadas.

**Decisão Necessária:**
- **Opção A:** Remover `ExpenseApproval` (recomendado para alçada simples)
- **Opção B:** Substituir VO `Approval` por entidade `ExpenseApproval` (para workflows complexos)

---

## Legends

| Símbolo | Significado |
|---------|-------------|
| **AR** | Aggregate Root |
| **E** | Entity |
| **VO** | Value Object |
| **⚠️** | Pendente de implementação ou correção |
| **✅** | Implementado |

---

## Shared Kernel

**Localização:** `src/core`

**Componentes:**
- `Entity<T>` - Classe base para entidades
- `AggregateRoot<T>` - Classe base para agregados
- `UniqueEntityID` - Identificador único de entidade
- `Either<L, R>` - Tipo funcional para tratamento de erros
- `Money` - Value Object monetário
- `DomainEvents` - Infraestrutura de eventos de domínio

**Objetivo:** Código compartilhado entre Bounded Contexts, mantendo isolamento (copiado, não biblioteca compartilhada).

---

## Isolamento entre Bounded Contexts

**Regras de Comunicação:**
- ❌ Payment **não** importa entidades internas de Account
- ❌ Account **não** importa entidades internas de Payment
- ✅ Comunicação via:
  - IDs (strings ou UniqueEntityID)
  - Domain Events
  - Application Services (interfaces)

**Exemplo Correto:**
```typescript
// ✅ Payment conhece apenas o ID da conta
class Expense {
  accountId: string  // Não importa DigitalAccount
}

// ✅ Payment consome evento de Account
class PaymentEventHandler {
  handleAccountStatusChanged(event: AccountStatusChangedEvent) {
    // Atualizar cache local
  }
}
```

**Exemplo Incorreto:**
```typescript
// ❌ NUNCA fazer isso
import { DigitalAccount } from '@modules/account/domain/entities/digital-account';

class Expense {
  account: DigitalAccount  // ❌ Acoplamento direto
}
```

---

## Referências de DDD

### Livros Essenciais
- **Eric Evans** - "Domain-Driven Design: Tackling Complexity in the Heart of Software" (2003)
- **Vaughn Vernon** - "Implementing Domain-Driven Design" (2013)
- **Vaughn Vernon** - "Domain-Driven Design Distilled" (2016)

### Artigos
- **Vaughn Vernon** - "Effective Aggregate Design" (série em 3 partes)
- **Martin Fowler** - "Anemic Domain Model" (anti-pattern)

### Recursos Online
- https://www.domainlanguage.com/ - Eric Evans DDD Community
- https://github.com/ddd-crew - DDD visual collaboration tools

---

**Última atualização:** Setembro 2026
