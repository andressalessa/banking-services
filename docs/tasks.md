# 📋 Checklist de Implementação do Domínio (DDD & Clean Arch)

## 📌 Passo 1: Infraestrutura Base de Domínio (`src/core`)
> **Estimativa de tempo:** 45 min – 1h
- [x] `src/core/either.ts` — Implementar `Left`, `Right` e o tipo `Either<L, R>` para Functional Error Handling.
- [x] `src/core/unique-entity-id.ts` — Implementar classe de identificador único (wrapper para UUID).
- [x] `src/core/entity.ts` — Implementar classe abstrata `Entity<Props>`.
- [x] `src/core/aggregate-root.ts` — Implementar classe abstrata `AggregateRoot<Props>`.

---

## 📌 Passo 2: Módulo de Conta Digital — Value Objects (`src/modules/account/domain`)
> **Estimativa de tempo:** 45 min – 1h
- [x] `money.ts` — VO com validações numéricas e operações (`add`, `subtract`, `isGreaterThan`).
- [x] `account-holder.ts` — VO com validação de CNPJ e dados do titular.
- [x] `bank-identity.ts` — VO encapsulando os dados bancários na SCD (`externalAccountId`, `bankCode`, `branch`, `accountNumber`).

---

## 📌 Passo 3: Módulo de Conta Digital — Entidade e Agregado (`src/modules/account/domain`)
> **Estimativa de tempo:** 1h – 1h30
- [x] `member.ts` — Entidade interna de Membros (PF, cargo, status; admin ativo é aprovador).
- [x] `digital-account.ts` — Aggregate Root da Conta Digital.
  - Implementar métodos: `reserveBalance`, `releaseReservedBalance`, `confirmDebit` e `changeStatus`.

---

## 📌 Passo 4: Módulo de Pagamentos — Value Objects (`src/modules/payment/domain`)
> **Estimativa de tempo:** 45 min – 1h
- [x] `payee.ts` — VO do Favorecido/Recebedor.
- [x] `payment-details.ts` — VO com suporte a Pix, Boleto e TED.

---

## 📌 Passo 5: Módulo de Pagamentos — Entidade e Agregado (`src/modules/payment/domain`)
> **Estimativa de tempo:** 1h – 1h30
- [x] `expense-approval.ts` — Entidade/Histórico de aprovações.
- [x] `approval.ts` - VO com validações das possíveis decisões
- [x] `expense.ts` — Aggregate Root da Despesa.
  - Implementar métodos: `approve`, `reject`, `schedule`, `pay` e `refund`.

---

## 📌 Passo 6: Testes Unitários de Domínio (`Vitest`)
> **Estimativa de tempo:** 1h – 1h30
- [ ] `digital-account.spec.ts` — Testar reserva de saldo (cenários de sucesso e `InsufficientBalanceError`), confirmação de débito e alteração de status.
- [ ] `expense.spec.ts` — Testar fluxo de vida completo da despesa (aprovação, agendamento, liquidação e estorno).
