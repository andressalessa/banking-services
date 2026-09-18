import { Payee, TaxIdType } from '@/modules/payment/domain/value-objects/payee';

export interface PrismaPayeeRaw {
  payee_name: string;
  payee_tax_id: string;
  payee_tax_id_type: string;
  payee_email: string | null;
}

export class PrismaPayeeMapper {
  static toDomain(raw: PrismaPayeeRaw): Payee {
    return Payee.create({
      name: raw.payee_name,
      taxId: raw.payee_tax_id,
      taxIdType: raw.payee_tax_id_type as TaxIdType,
      email: raw.payee_email ?? undefined,
    });
  }

  static toPrisma(payee: Payee): PrismaPayeeRaw {
    return {
      payee_name: payee.name,
      payee_tax_id: payee.taxId,
      payee_tax_id_type: payee.taxIdType,
      payee_email: payee.email ?? null,
    };
  }
}
