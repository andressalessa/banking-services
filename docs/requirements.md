# Requisitos do Sistema

> **Objetivo:** Este documento descreve os requisitos funcionais (RF), não-funcionais (RNF) e regras de negócio (RN) do Banking Services.

---

## Requisitos Funcionais (RF)

### ✅ Implementados

#### RF-01: Criar Conta Digital
**Descrição:** Criar uma nova conta digital com aprovadores (Pessoa Física).

**Critérios de Aceitação:**
- Informar dados do titular (CNPJ, razão social, nome fantasia)
- Informar dados bancários (código do banco, agência, conta)
- Adicionar pelo menos um membro ADMIN + ACTIVE (aprovador)
- Status inicial: PENDING

**Endpoint:** `POST /api/v1/accounts`

---

#### RF-02: Alterar Status da Conta Digital
**Descrição:** Transicionar status da conta digital entre estados válidos.

**Estados:**
- Ativar (VALIDATED → ACTIVE, BLOCKED → ACTIVE)
- Bloquear (ACTIVE → BLOCKED)
- Encerrar (qualquer → CLOSED)

**Critérios de Aceitação:**
- Respeitar transições válidas de status
- Emitir evento `AccountStatusChanged`

**Endpoint:** `PATCH /api/v1/accounts/:id/status`

---

#### RF-03: Criar Despesa
**Descrição:** Criar uma nova despesa vinculada a uma conta digital.

**Critérios de Aceitação:**
- Status inicial: DRAFT
- Approval workflow: PENDING
- Informar beneficiário (Payee)
- Informar valor (Money)
- Informar método de pagamento (PIX, Boleto, TED)
- Definir alçada mínima de aprovações

**Endpoint:** `POST /api/v1/expenses`

---

#### RF-04: Aprovar ou Rejeitar Despesa
**Descrição:** Registrar decisão de aprovação ou rejeição por um aprovador.

**Critérios de Aceitação:**
- Aprovador deve ser membro ADMIN + ACTIVE da conta
- Mesmo aprovador não pode decidir duas vezes
- Rejeição exige motivo
- Workflow transiciona para APPROVED quando atingir alçada mínima
- Workflow transiciona para REJECTED se alguma rejeição ocorrer

**Endpoints:**
- `POST /api/v1/expenses/:id/approve`
- `POST /api/v1/expenses/:id/reject`

---

### ⚠️ Pendentes de Implementação

#### RF-05: Agendar/Enviar Despesa para Pagamento
**Descrição:** Após aprovação, agendar despesa para pagamento.

**Critérios de Aceitação:**
- Despesa deve estar APPROVED (workflow)
- Reservar saldo na DigitalAccount (`reserveBalance`)
- Alterar status para SCHEDULED
- Emitir evento `ExpenseScheduled`

**Endpoint:** `POST /api/v1/expenses/:id/schedule`

**Status:** ⚠️ Não implementado
- Enum `ExpenseStatus` não possui `SCHEDULED`
- Método `schedule()` não existe no AR Expense

---

#### RF-06: Processar Liquidação de Despesa
**Descrição:** Confirmar pagamento após retorno da SCD (Sistema de Pagamento).

**Critérios de Aceitação:**
- Despesa deve estar SCHEDULED ou IN_PROCESSING
- Receber confirmação da SCD (webhook ou polling)
- Debitar saldo reservado na DigitalAccount (`confirmDebit`)
- Alterar status para PAID
- Registrar `paidAt`
- Emitir evento `ExpensePaid`

**Endpoint:** `POST /api/v1/expenses/:id/settle` (webhook interno ou Temporal.io)

**Status:** ⚠️ Parcialmente implementado
- Método `markAsPaid()` existe no AR Expense
- Falta integração com SCD
- Falta estados intermediários: `IN_PROCESSING`

---

#### RF-07: Estornar ou Cancelar Despesa
**Descrição:** Cancelar despesa antes do envio ou estornar após liquidação.

**Casos de Uso:**

**Caso 1: Cancelamento (antes de SCHEDULED)**
- Status atual: DRAFT
- Ação: Cancelar
- Novo status: CANCELLED
- Emitir evento `ExpenseCancelled`

**Caso 2: Cancelamento (após agendamento)**
- Status atual: SCHEDULED
- Ação: Cancelar e liberar saldo reservado (`releaseReservedBalance`)
- Novo status: CANCELLED

**Caso 3: Estorno (após liquidação)**
- Status atual: PAID
- Ação: Estornar pagamento na SCD + devolver saldo debitado
- Novo status: REFUNDED
- Emitir evento `ExpenseRefunded`

**Endpoints:**
- `POST /api/v1/expenses/:id/cancel`
- `POST /api/v1/expenses/:id/refund`

**Status:** ⚠️ Parcialmente implementado
- Método `cancel()` existe no AR Expense (apenas DRAFT → CANCELLED)
- Falta método `refund()` para PAID → REFUNDED
- Falta integração com operações de saldo (release/refund)
- Enum `ExpenseStatus` não possui `REFUNDED`

---

## Requisitos Não-Funcionais (RNF)

### Tecnologia

**RNF-01: Stack Backend**
- Framework: NestJS (TypeScript)
- Banco de dados: PostgreSQL
- ORM: TypeORM
- Testes: Jest

**RNF-02: Arquitetura**
- Padrão: Clean Architecture + DDD
- Estrutura: Modular Monolith (Fase 1)
- Isolamento: Bounded Contexts por pasta (`src/modules/*`)

**RNF-03: Shared Kernel**
- Localização: `src/core`
- Componentes: Entity, AggregateRoot, UniqueEntityID, Either, Money, DomainEvents

---

### Persistência

**RNF-04: Valores Monetários**
- Tipo: `NUMERIC(15, 2)` no PostgreSQL
- Precisão: 2 casas decimais
- Armazenamento interno: centavos (inteiro) no domínio

**RNF-05: Soft Delete**
- Despesas: não deletar fisicamente, usar flag `deletedAt`
- Motivo: auditoria e compliance

---

### Integração

**RNF-06: Message Broker**
- Tecnologia: RabbitMQ
- Uso: Comunicação assíncrona entre Bounded Contexts
- Fase 2: Comunicação entre microsserviços

**RNF-07: Orquestração de Workflows**
- Tecnologia: Temporal.io
- Uso: Sagas distribuídas (agendamento, liquidação, estorno)
- Fase 2: Workflows de longa duração

**RNF-08: Gateway de Pagamento**
- Sistema: SCD (Sistema de Contas Digitais)
- Métodos suportados: PIX, Boleto, TED
- Comunicação: REST API + Webhooks

---

### Testes

**RNF-09: Estrutura de Testes**
- Localização: Co-locados com o código (`expense.ts` + `expense.spec.ts`)
- ❌ Proibido: Usar pastas `__tests__`

**RNF-10: Cobertura de Testes (Meta)**
- Domínio: > 80%
- Use Cases: > 70%
- Integration: Principais fluxos (RF 01-07)

---

### Performance

**RNF-11: SLA de Latência (Meta)**
- Endpoints de leitura (GET): P95 < 500ms
- Endpoints de escrita (POST/PATCH): P95 < 2s
- Operações de pagamento: P95 < 5s (inclui chamadas externas)

**RNF-12: Disponibilidade**
- Meta: > 99% (ambiente de produção)

---

### Segurança

**RNF-13: Encriptação de Dados Sensíveis (futuro)**
- PIX keys, dados bancários, CNPJ devem ser encriptados em repouso
- Tecnologia: `@nestjs/crypto` ou `crypto-js`

**RNF-14: Autenticação e Autorização (futuro)**
- OAuth2 + JWT
- Controle de acesso por papel (ADMIN vs COLLABORATOR)

**RNF-15: Rate Limiting (futuro)**
- Limite: 100 req/s por IP
- Tecnologia: `@nestjs/throttler`

---

### Compliance

**RNF-16: Auditoria**
- Registrar todas as mudanças de estado críticas
- Informações: timestamp, usuário responsável, motivo
- Retenção: 5 anos (legislação brasileira)

**RNF-17: LGPD**
- Dados pessoais (CPF, CNPJ) são sensíveis
- Implementar consentimento, portabilidade e exclusão

**RNF-18: Regulamentação do Banco Central**
- PIX: seguir normas do BC (https://www.bcb.gov.br/estabilidadefinanceira/pix)
- Segurança cibernética: Resolução CMN 4.658/2018

---

## Regras de Negócio (RN)

### Account (Conta Digital)

**RN-01: Aprovadores Obrigatórios**
- Toda conta deve ter pelo menos um membro ADMIN + ACTIVE
- Operação de criação falha se não houver aprovador

**RN-02: Transições de Status**
```
PENDING → VALIDATED | CLOSED
VALIDATED → ACTIVE | CLOSED
ACTIVE → BLOCKED | CLOSED
BLOCKED → ACTIVE | CLOSED
CLOSED → ∅ (final, sem transições)
```

**RN-03: Operações de Saldo**
- Reserva, liberação e débito apenas com conta ACTIVE
- Não permitir operações em contas PENDING, VALIDATED, BLOCKED ou CLOSED

**RN-04: Saldo Disponível**
- `availableBalance = balance - reservedBalance`
- Reserva exige `availableBalance >= amount`

**RN-05: Liberação e Débito**
- Liberação de reserva exige `reservedBalance >= amount`
- Confirmação de débito exige `reservedBalance >= amount`

---

### Payment (Despesa)

**RN-06: Status Inicial**
- Despesa nasce com status DRAFT
- Approval workflow nasce PENDING

**RN-07: Rejeição de Despesa**
- Rejeição exige motivo (`rejectionReason`)
- Uma única rejeição muda workflow para REJECTED

**RN-08: Decisões de Aprovação**
- Não se adiciona decisão se workflow já está APPROVED ou REJECTED
- Mesmo aprovador não pode decidir duas vezes

**RN-09: Aprovação Completa**
- Workflow muda para APPROVED quando `decisions.length >= requiredApprovalsCount`
- Todas as decisões devem ter status APPROVED

**RN-10: Marcar como Paga**
- `markAsPaid` exige:
  - Approval workflow APPROVED
  - Despesa não CANCELLED
  - Despesa não já PAID

**RN-11: Cancelamento**
- Não se cancela despesa já PAID
- Despesa DRAFT ou SCHEDULED pode ser cancelada

---

### Payment (Pendentes - RF 05-07)

**RN-12: Agendamento de Pagamento** ⚠️ Não implementado
- Agendar exige:
  - Approval workflow APPROVED
  - Conta vinculada ACTIVE
  - Saldo disponível >= valor da despesa
- Ações:
  - Reservar saldo na conta (`reserveBalance`)
  - Mudar status para SCHEDULED

**RN-13: Liquidação de Pagamento** ⚠️ Não implementado
- Liquidar exige:
  - Status SCHEDULED ou IN_PROCESSING
  - Confirmação da SCD (retorno de webhook)
- Ações:
  - Debitar saldo reservado (`confirmDebit`)
  - Mudar status para PAID
  - Registrar `paidAt`

**RN-14: Falha de Pagamento** ⚠️ Não implementado
- Se SCD retornar erro:
  - Liberar saldo reservado (`releaseReservedBalance`)
  - Mudar status para FAILED
  - Registrar motivo da falha

**RN-15: Estorno de Pagamento** ⚠️ Não implementado
- Estornar exige:
  - Status PAID
  - Solicitação de estorno (manual ou automática)
- Ações:
  - Solicitar estorno na SCD
  - Devolver valor ao saldo da conta
  - Mudar status para REFUNDED

---

## Validações de Domínio

### AccountHolder

**VAL-01: CNPJ**
- ⚠️ Pendente: Validar formato (XX.XXX.XXX/XXXX-XX)
- ⚠️ Pendente: Validar dígitos verificadores (algoritmo oficial)

---

### Payee

**VAL-02: Tax ID**
- Validar formato de CPF ou CNPJ conforme `taxIdType`

**VAL-03: PIX Key**
- ⚠️ Pendente: Validar formato conforme `pixKeyType`:
  - CPF: XX.XXX.XXX/XXXX-XX
  - CNPJ: XX.XXX.XXX/XXXX-XX
  - EMAIL: formato válido de email
  - PHONE: +55XXXXXXXXXXX
  - RANDOM: UUID válido

---

### Money

**VAL-04: Valor Não Negativo**
- Money não pode ter valor negativo
- Operações que resultam em valor negativo devem lançar erro

**VAL-05: Precisão**
- 2 casas decimais no máximo

---

## Glossário de Domínio

- **Conta Digital:** Conta bancária empresarial gerenciada pelo sistema
- **Titular:** Pessoa Jurídica proprietária da conta (CNPJ)
- **Membro:** Pessoa Física vinculada à conta (ADMIN ou COLLABORATOR)
- **Aprovador:** Membro ADMIN + ACTIVE com poder de aprovar despesas
- **Despesa:** Pagamento a ser realizado (expense)
- **Beneficiário:** Destinatário do pagamento (payee)
- **Alçada:** Número mínimo de aprovações necessárias
- **Saldo Disponível:** balance - reservedBalance
- **SCD:** Sistema de Contas Digitais (gateway de pagamento externo)

---

**Última atualização:** Setembro 2026
