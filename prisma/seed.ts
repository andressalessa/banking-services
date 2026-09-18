import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440000';
const ADMIN_MEMBER_ID = '550e8400-e29b-41d4-a716-446655440001';
const OPERATOR_MEMBER_ID = '550e8400-e29b-41d4-a716-446655440002';
const ADMIN_PERSON_ID = '660e8400-e29b-41d4-a716-446655440001';
const OPERATOR_PERSON_ID = '660e8400-e29b-41d4-a716-446655440002';
const DRAFT_EXPENSE_ID = '770e8400-e29b-41d4-a716-446655440000';
const APPROVED_EXPENSE_ID = '770e8400-e29b-41d4-a716-446655440001';

async function main() {
  console.log('Seeding database...');

  const account = await prisma.digitalAccount.create({
    data: {
      id: ACCOUNT_ID,
      holder_cnpj: '12345678000195',
      holder_legal_name: 'Empresa XYZ Ltda',
      holder_trade_name: 'XYZ',
      balance_cents: BigInt(1000000),
      reserved_balance_cents: BigInt(0),
      currency: 'BRL',
      status: 'ACTIVE',
      bank_code: '001',
      bank_branch: '0001',
      bank_account_number: '123456-7',
      external_account_id: 'scd-account-001',
      members: {
        create: [
          {
            id: ADMIN_MEMBER_ID,
            person_id: ADMIN_PERSON_ID,
            full_name: 'João Silva',
            cpf: '39053344705',
            email: 'joao.silva@xyz.com',
            phone: '+5511987654321',
            role: 'ADMIN',
            status: 'ACTIVE',
          },
          {
            id: OPERATOR_MEMBER_ID,
            person_id: OPERATOR_PERSON_ID,
            full_name: 'Maria Santos',
            cpf: '52998224725',
            email: 'maria.santos@xyz.com',
            phone: '+5511976543210',
            role: 'COLLABORATOR',
            status: 'ACTIVE',
          },
        ],
      },
    },
  });

  const draftExpense = await prisma.expense.create({
    data: {
      id: DRAFT_EXPENSE_ID,
      account_id: ACCOUNT_ID,
      payee_name: 'Fornecedor Alfa',
      payee_tax_id: '39053344705',
      payee_tax_id_type: 'CPF',
      amount_cents: BigInt(50000),
      currency: 'BRL',
      payment_details: {
        method: 'PIX',
        pixKey: 'maria.payee@example.com',
        pixKeyType: 'EMAIL',
      },
      required_approvals_count: 1,
      approval_status: 'PENDING',
      status: 'DRAFT',
      due_date: new Date('2026-12-31T00:00:00.000Z'),
    },
  });

  const approvedExpense = await prisma.expense.create({
    data: {
      id: APPROVED_EXPENSE_ID,
      account_id: ACCOUNT_ID,
      payee_name: 'Fornecedor Beta',
      payee_tax_id: '12345678000195',
      payee_tax_id_type: 'CNPJ',
      amount_cents: BigInt(150000),
      currency: 'BRL',
      payment_details: {
        method: 'PIX',
        pixKey: '12345678000195',
        pixKeyType: 'CNPJ',
      },
      required_approvals_count: 1,
      approval_status: 'APPROVED',
      status: 'DRAFT',
      due_date: new Date('2026-11-30T00:00:00.000Z'),
      decisions: {
        create: {
          id: '880e8400-e29b-41d4-a716-446655440000',
          approver_person_id: ADMIN_PERSON_ID,
          decision_status: 'APPROVED',
        },
      },
    },
  });

  console.log('Seed completed.');
  console.log({
    accountId: account.id,
    draftExpenseId: draftExpense.id,
    approvedExpenseId: approvedExpense.id,
  });
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
