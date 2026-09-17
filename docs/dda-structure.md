# Domain structure

## Aggregates

- DigitalAccount (AR)
    - id: AccountId (VO) (probably UniqueEntityId class)
    - holder (VO) AccountHolder[cnpj, legalName, tradeName]
    - status (VO/Enum) AccountStatus[PENDING, VALIDATED, ACTIVE, BLOCKED, CLOSED]
    - bankIdentity (VO) BankIdentity[externalAccountId, bankCode, branch, accountNumber]
    - balance: Money (VO)
    - reservedBalance: Money (VO)
    - members (E[]) Member[memberId, personId, role, status]
      - role: ADMIN | COLLABORATOR
      - status: ACTIVE | INACTIVE
      - admin ativo é aprovador; colaborador não é
    - createdAt: Date
    - updatedAt?: Date | null

- Expense (AR)
    - id: ExpenseId (VO) (probably UniqueEntityId class)
    - accountId (VO) (probably UniqueEntityId class)
    - payee: (VO) Payee
    - amount (VO) Money
    - paymentMethod: (VO) PaymentMethod
    - paymentDetails (VO) PaymentDetails
    - paymentStatus (VO/Enum) PaymentStatus[DRAFT, PENDING, SCHEDULED, IN_PROCESSING, PAID, FAILED, CANCELLED, REFUNDED]
    - approvalStatus (Enum) [PENDING, APPROVED, REJECTED]
    - approvals ??
    - dueDate: Date
    - scheduledTo?: Date | null
    - paidAt?: Date | null
    - createdAt: Date
    - updatedAt?: Date | null


# Legends

AR -> agregate root
E -> entity
VO -> value object


## RF
### A API deve permitir:
01 - Criar uma nova conta digital com aprovadores (PF)
02 - Alterar status da conta digital (Ativar | Bloquear | Encerrar)
03 - Criar uma despesa (Status inicial: PENDING de aprovação e pagamento)
04 - Aprovar ou Rejeitar uma despesa (Altera approvalStatus)
05 - Agendar/Enviar uma despesa para pagamento (Bloqueia saldo na DigitalAccount e altera paymentStatus para SCHEDULED)
06 - Processar liquidação de despesa (Debita o saldo reservado e marca como PAID com o retorno da SCD)
07 - Estornar ou Cancelar uma despesa (Devolve saldo reservado/debitado e marca como REFUNDED ou CANCELLED)


## RNF


## RN
