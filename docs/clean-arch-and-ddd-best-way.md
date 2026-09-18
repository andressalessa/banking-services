# Clean Architecture & DDD: Separação de Camadas

Esta documentação descreve as responsabilidades de cada camada na Clean Architecture e no Domain-Driven Design (DDD), garantindo o desacoplamento de frameworks, bancos de dados e detalhes de infraestrutura.

---

## 1. Enterprise / Domain (`domain/`)

* **O que é:** É o coração do negócio. Contém as regras que existiriam mesmo sem a presença do computador (regras de alçada de aprovação, cálculo de juros, validação de CNPJ, controle de saldo e transições de estado).
* **O que entra aqui:**
  * *Entities*
  * *Aggregate Roots*
  * *Value Objects*
  * *Domain Errors*
  * *Domain Events*
* **Regra de Ouro:** Não importa nada de fora. É TypeScript puro. Não possui conhecimento sobre NestJS, Prisma, TypeORM, HTTP ou PostgreSQL.

---

## 2. Application (`application/`)

* **O que é:** Camada que orquestra os casos de uso e fluxos da aplicação (*Use Cases* / *Services*). Ela não define as regras de negócio intrínsecas da entidade, mas gerencia o passo a passo necessário para que uma ação do sistema seja executada.
* **O que entra aqui:**
  * *Use Cases* (ex: `CreateExpenseUseCase`, `PayExpenseUseCase`)
  * DTOs de aplicação
  * Interfaces/Contratos dos Repositórios (ex: `AccountsRepository`, `ExpensesRepository`)
* **Regra de Ouro:** Conhece a camada de Domínio, mas não conhece a implementação concreta do banco de dados ou bibliotecas externas. Alterar o ORM do projeto não afeta esta camada.

---

## 3. Infrastructure (`infrastructure/`)

* **O que é:** Camada de detalhes de tecnologia e mundo externo. É onde frameworks, drivers e bibliotecas ganham vida para conectar o software aos agentes externos (web, banco de dados, mensageria).
* **O que entra aqui:**
  * Controllers do NestJS / DTOs de Entrada HTTP
  * Mappers (conversores de modelos relacionais para Entidades de Domínio)
  * Implementações concretas dos Repositórios (Prisma, TypeORM)
  * Integrações com filas e orquestradores (RabbitMQ, Temporal.io)
* **Regra de Ouro:** Conhece as camadas de Aplicação e Domínio. Nenhuma das camadas internas possui conhecimento sobre os detalhes contidos na Infraestrutura.

---

## Fluxo e Dependência das Camadas

```text
┌────────────────────────────────────────────────────────┐
│                INFRASTRUCTURE (NestJS)                 │
│   Controllers, Prisma, TypeORM, RabbitMQ, Mappers      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                      APPLICATION                       │
│        Use Cases & Interfaces de Repositório           │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                  ENTERPRISE / DOMAIN                   │
│   Expense, DigitalAccount, Approval, Money, Events     │
└────────────────────────────────────────────────────────┘
