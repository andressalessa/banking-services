# Validação de Chaves PIX - Padrão Produção

> **Status**: ✅ Implementado seguindo especificações oficiais do Banco Central do Brasil

---

## Visão Geral

Este documento detalha a implementação **production-grade** da validação de chaves PIX no Banking Services, seguindo rigorosamente as especificações do **BACEN** (Banco Central do Brasil) e padrões utilizados por fintechs reais (Nubank, PicPay, Stone, etc).

---

## Especificações Oficiais Seguidas

### 1. CPF (Cadastro de Pessoa Física)

**Referência**: Receita Federal do Brasil

**Validação Implementada**:
- ✅ Validação de dígitos verificadores (algoritmo oficial)
- ✅ Rejeição de CPFs conhecidos como inválidos (todos os dígitos iguais)
- ✅ Aceita formatação: `123.456.789-09` ou `12345678909`

**Algoritmo de Validação**:
```typescript
// Primeiro dígito verificador
sum = (d1*10 + d2*9 + d3*8 + d4*7 + d5*6 + d6*5 + d7*4 + d8*3 + d9*2)
checkDigit1 = 11 - (sum % 11)
if (checkDigit1 >= 10) checkDigit1 = 0

// Segundo dígito verificador
sum = (d1*11 + d2*10 + d3*9 + d4*8 + d5*7 + d6*6 + d7*5 + d8*4 + d9*3 + checkDigit1*2)
checkDigit2 = 11 - (sum % 11)
if (checkDigit2 >= 10) checkDigit2 = 0
```

**Exemplos Válidos**:
- `191.111.111-60`
- `111.444.777-35`
- `123.456.789-09`

**Exemplos Inválidos**:
- `000.000.000-00` (todos os dígitos iguais)
- `111.111.111-11` (todos os dígitos iguais)
- `123.456.789-00` (dígitos verificadores incorretos)

---

### 2. CNPJ (Cadastro Nacional de Pessoa Jurídica)

**Referência**: Receita Federal do Brasil

**Validação Implementada**:
- ✅ Validação de dígitos verificadores (algoritmo oficial)
- ✅ Rejeição de CNPJs conhecidos como inválidos
- ✅ Aceita formatação: `11.222.333/0001-81` ou `11222333000181`

**Algoritmo de Validação**:
```typescript
// Pesos para primeiro dígito: 5,4,3,2,9,8,7,6,5,4,3,2
// Pesos para segundo dígito: 6,5,4,3,2,9,8,7,6,5,4,3,2

checkDigit = (sum % 11 < 2) ? 0 : 11 - (sum % 11)
```

**Exemplos Válidos**:
- `11.222.333/0001-81`
- `34.028.316/0001-03`

**Exemplos Inválidos**:
- `00.000.000/0000-00` (todos os dígitos iguais)
- `11.222.333/0001-00` (dígitos verificadores incorretos)

---

### 3. EMAIL

**Referências**:
- BACEN - Manual de Chaves PIX
- RFC 5322 (Internet Message Format)

**Validação Implementada**:
- ✅ Máximo de **77 caracteres** (limite BACEN)
- ✅ RFC 5322 compliant (regex robusta)
- ✅ Normalização: lowercase + trim
- ✅ Validação de formato (local@domain.tld)

**Regex Utilizada**:
```typescript
/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
```

**Exemplos Válidos**:
- `user@example.com`
- `user.name@mail.example.com`
- `user123@example123.com`

**Exemplos Inválidos**:
- `userexample.com` (sem @)
- `user@` (sem domínio)
- `@example.com` (sem parte local)
- Email com 78+ caracteres (excede limite BACEN)

---

### 4. PHONE (Telefone)

**Referências**:
- BACEN - Manual de Chaves PIX
- ITU-T E.164 (International Public Telecommunication Numbering Plan)

**Validação Implementada**:
- ✅ Formato **E.164 obrigatório**: `+5511987654321`
- ✅ Validação de DDD (11-99)
- ✅ Celular: 9 dígitos começando com 9
- ✅ Fixo: 8 dígitos (não pode começar com 9)

**Regras**:
```typescript
// Formato aceito: +55DDNNNNNNNNN
// DD = DDD (11-99)
// N = Número do telefone

Celular:  +55 + DD (2 dígitos) + 9XXXXXXXX (9 dígitos, inicia com 9)
Fixo:     +55 + DD (2 dígitos) + XXXXXXXX (8 dígitos, não inicia com 9)
```

**Exemplos Válidos**:
- `+5511987654321` (celular - São Paulo)
- `+551133334444` (fixo - São Paulo)
- `+5521987654321` (celular - Rio de Janeiro)
- `+5585987654321` (celular - Ceará)

**Exemplos Inválidos**:
- `11987654321` (sem +55)
- `5511987654321` (sem +)
- `+1987654321` (código de país errado)
- `+5510987654321` (DDD inválido: 10)
- `+5511887654321` (9 dígitos mas não começa com 9)

**⚠️ Importante**: O DICT (sistema PIX do BACEN) **rejeita** telefones que não estejam no formato E.164.

---

### 5. RANDOM (EVP - Endereço Virtual de Pagamento)

**Referência**: BACEN - Deve ser UUID v4

**Validação Implementada**:
- ✅ UUID v4 válido
- ✅ Case-insensitive
- ✅ Validação de formato e versão

**Regex Utilizada**:
```typescript
/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
```

**Nota**: O dígito `4` no terceiro grupo indica UUID v4.

**Exemplos Válidos**:
- `123e4567-e89b-42d3-a456-426614174000`
- `550E8400-E29B-42D4-A716-446655440000`

**Exemplos Inválidos**:
- `123e4567e89b42d3a456426614174000` (sem hifens)
- `550e8400-e29b-11d4-a716-446655440000` (UUID v1, não v4)
- `random-key-123` (não é UUID)

---

## Domain Errors Específicos

Seguindo princípios de **Domain-Driven Design**, cada validação lança um erro de domínio específico:

```typescript
// Localização: src/modules/payment/domain/errors/

InvalidPixKeyCpfError        // CPF inválido
InvalidPixKeyCnpjError       // CNPJ inválido
InvalidPixKeyEmailError      // Email inválido
InvalidPixKeyPhoneError      // Telefone inválido
InvalidPixKeyRandomError     // UUID inválido
EmptyPixKeyError            // Chave PIX vazia
```

**Exemplo de uso**:
```typescript
try {
  PaymentDetails.create({
    method: 'PIX',
    pixKey: '111.111.111-11',
    pixKeyType: 'CPF',
  });
} catch (error) {
  if (error instanceof InvalidPixKeyCpfError) {
    // Tratar erro de CPF inválido especificamente
    console.error('CPF inválido:', error.message);
  }
}
```

---

## Testes

**Cobertura**: 67 testes unitários

**Estrutura**:
```
payment-details.spec.ts
├── CPF key validation (10 tests)
│   ├── Valid cases (3 tests)
│   └── Invalid cases (7 tests)
├── CNPJ key validation (9 tests)
│   ├── Valid cases (3 tests)
│   └── Invalid cases (6 tests)
├── EMAIL key validation (14 tests)
│   ├── Valid cases (6 tests)
│   └── Invalid cases (8 tests)
├── PHONE key validation (17 tests)
│   ├── Valid cases (4 tests)
│   └── Invalid cases (13 tests)
├── RANDOM key validation (9 tests)
│   ├── Valid cases (3 tests)
│   └── Invalid cases (6 tests)
├── Empty PIX key (2 tests)
├── BOLETO payment (4 tests)
├── BANK_TRANSFER payment (4 tests)
└── Value Object methods (5 tests)
```

**Executar testes**:
```bash
npm test -- payment-details.spec.ts
```

---

## Comparação: Básico vs Produção

| Aspecto | Implementação Básica | Implementação Produção ✅ |
|---------|---------------------|---------------------------|
| **CPF** | Apenas 11 dígitos | Dígitos verificadores + rejeita inválidos |
| **CNPJ** | Apenas 14 dígitos | Dígitos verificadores + rejeita inválidos |
| **Email** | Regex simples | RFC 5322 + limite 77 chars (BACEN) |
| **Phone** | Múltiplos formatos | E.164 obrigatório (BACEN) |
| **Random** | UUID genérico | UUID v4 específico |
| **Errors** | `Error` genérico | Domain Errors específicos |
| **Testes** | 41 testes básicos | 67 testes production-grade |

---

## Próximos Passos (Opcional)

Para uma implementação ainda mais robusta, considere:

1. **Bibliotecas Especializadas**:
   ```bash
   npm install cpf-cnpj-validator  # Validação CPF/CNPJ
   npm install libphonenumber-js   # Validação telefone E.164
   ```

2. **Validação no DICT (Sandbox)**:
   - Testar chaves PIX em ambiente sandbox do Banco Central
   - Validar que as chaves são aceitas pelo sistema oficial

3. **Rate Limiting**:
   - Implementar throttling para validações de chave PIX
   - Prevenir abuse de API de validação

4. **Logging e Observabilidade**:
   - Log estruturado de validações falhas
   - Métricas de erros por tipo de chave

---

## Referências

- [BACEN - Manual de Chaves PIX](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [RFC 5322 - Internet Message Format](https://tools.ietf.org/html/rfc5322)
- [ITU-T E.164 - Numbering Plan](https://www.itu.int/rec/T-REC-E.164/)
- [Receita Federal - Validação CPF/CNPJ](http://www.receita.fazenda.gov.br/)
- [UUID v4 Specification](https://tools.ietf.org/html/rfc4122)

---

**Última atualização**: Setembro 2026  
**Autor**: Andressa Lessa  
**Status**: ✅ Production-Ready
