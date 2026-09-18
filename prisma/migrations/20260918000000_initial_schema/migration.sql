-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('PENDING', 'VALIDATED', 'ACTIVE', 'BLOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "member_role" AS ENUM ('ADMIN', 'COLLABORATOR');

-- CreateEnum
CREATE TYPE "member_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "expense_status" AS ENUM ('DRAFT', 'SCHEDULED', 'PROCESSING', 'PAID', 'REFUNDED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "approval_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "approval_decision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "holder_cnpj" VARCHAR(14) NOT NULL,
    "holder_legal_name" VARCHAR(255) NOT NULL,
    "holder_trade_name" VARCHAR(255) NOT NULL,
    "balance_cents" BIGINT NOT NULL DEFAULT 0,
    "reserved_balance_cents" BIGINT NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "status" "account_status" NOT NULL DEFAULT 'PENDING',
    "bank_code" VARCHAR(3) NOT NULL,
    "bank_branch" VARCHAR(10) NOT NULL,
    "bank_account_number" VARCHAR(20) NOT NULL,
    "external_account_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "full_name" VARCHAR(255),
    "cpf" VARCHAR(11),
    "email" VARCHAR(77),
    "phone" VARCHAR(16),
    "role" "member_role" NOT NULL,
    "status" "member_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "payee_name" VARCHAR(255) NOT NULL,
    "payee_tax_id" VARCHAR(14) NOT NULL,
    "payee_tax_id_type" VARCHAR(10) NOT NULL,
    "payee_email" VARCHAR(77),
    "amount_cents" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "payment_details" JSONB NOT NULL,
    "required_approvals_count" INTEGER NOT NULL DEFAULT 1,
    "approval_status" "approval_status" NOT NULL DEFAULT 'PENDING',
    "status" "expense_status" NOT NULL DEFAULT 'DRAFT',
    "due_date" TIMESTAMPTZ NOT NULL,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_decisions" (
    "id" UUID NOT NULL,
    "expense_id" UUID NOT NULL,
    "approver_person_id" UUID NOT NULL,
    "decision_status" "approval_decision" NOT NULL,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_holder_cnpj_idx" ON "accounts"("holder_cnpj");

-- CreateIndex
CREATE INDEX "accounts_status_idx" ON "accounts"("status");

-- CreateIndex
CREATE INDEX "accounts_deleted_at_idx" ON "accounts"("deleted_at");

-- CreateIndex
CREATE INDEX "members_cpf_idx" ON "members"("cpf");

-- CreateIndex
CREATE INDEX "members_account_id_status_idx" ON "members"("account_id", "status");

-- CreateIndex
CREATE INDEX "members_person_id_idx" ON "members"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_account_id_person_id_key" ON "members"("account_id", "person_id");

-- CreateIndex
CREATE INDEX "expenses_account_id_idx" ON "expenses"("account_id");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "expenses_due_date_idx" ON "expenses"("due_date");

-- CreateIndex
CREATE INDEX "expenses_created_at_idx" ON "expenses"("created_at");

-- CreateIndex
CREATE INDEX "expenses_payee_tax_id_idx" ON "expenses"("payee_tax_id");

-- CreateIndex
CREATE INDEX "expenses_deleted_at_idx" ON "expenses"("deleted_at");

-- CreateIndex
CREATE INDEX "expense_decisions_expense_id_idx" ON "expense_decisions"("expense_id");

-- CreateIndex
CREATE INDEX "expense_decisions_approver_person_id_idx" ON "expense_decisions"("approver_person_id");

-- CreateIndex
CREATE INDEX "expense_decisions_created_at_idx" ON "expense_decisions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "expense_decisions_expense_id_approver_person_id_key" ON "expense_decisions"("expense_id", "approver_person_id");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_decisions" ADD CONSTRAINT "expense_decisions_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

