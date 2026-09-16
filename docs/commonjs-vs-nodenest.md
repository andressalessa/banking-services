# 📚 Guia Definitivo: TypeScript + Jest no NestJS sem Dores de Cabeça

## 1. O Problema: ESM (`NodeNext`) vs CommonJS

O Node.js possui dois sistemas de módulos principais:

* **CommonJS (CJS):** Padrão tradicional do Node.js. Usa `require()` e `module.exports`.
* **ES Modules (ESM / `NodeNext`):** Padrão moderno do JavaScript. Usa `import` e `export` nativos.

### Por que o Jest quebra com `NodeNext`?
O Jest foi construído nativamente sobre o **CommonJS**. Quando configuramos o TypeScript com `"module": "nodenext"`, três coisas acontecem:
1. O TypeScript **obriga** você a colocar a extensão `.js` em todos os imports locais (ex: `from './user.js'`).
2. O Jest tenta buscar o arquivo real `./user.js` em disco, mas como em desenvolvimento o arquivo é `./user.ts`, ele falha (`Cannot find module`).
3. Módulos do NestJS (como `@nestjs/testing`) são importados como ESM, e o Jest em modo CommonJS lança o erro: `Must use import to load ES Module`.

---

## 2. A Solução: Configuração do `tsconfig.json`

Para manter o ecossistema do NestJS funcionando de forma nativa e sem precisar de transpiladores extras no Jest, utilizamos o ecossistema em **CommonJS** alinhado ao compilador moderno (`bundler`).

### O `tsconfig.json` Ideal

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "bundler",
    "rootDir": "./src",
    "outDir": "./dist",
    "target": "ES2023",
    "types": ["node", "jest"],
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "declaration": true,
    "removeComments": true,
    "sourceMap": true,
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "strictPropertyInitialization": false
  }
}
```

---

## 3. Entendendo as Propriedades Chave

### `"module": "commonjs"`
* **O que faz:** Diz ao TypeScript para compilar os `import` e `export` do seu código para chamadas `require()` do CommonJS no código final.
* **Por que usamos:** É o formato que o NestJS e o Jest entendem sem precisar de flags experimentais do Node.js.

### `"moduleResolution": "bundler"`
* **O que faz:** Define como o TypeScript busca os arquivos importados no seu código.
* **Por que usamos:** O antigo modo `"node"` (Node10) foi descontinuado no TypeScript 5+. O modo `"bundler"` permite importar arquivos sem digitar a extensão `.js` no final (ex: `import { User } from './user'`), resolvendo o problema de resolução do Jest.

### `"rootDir": "./src"`
* **O que faz:** Define explicitamente qual é a pasta raiz do código fonte do projeto.
* **Por que usamos:** Evita o erro **`TS5011`**. Sem essa propriedade, quando o Jest compila testes em pastas profundas (ex: `src/core/events/`), o TypeScript tenta recalcular o diretório raiz dinamicamente e falha.

---

## 4. O `jest.config.ts` Padrão

Com o `tsconfig.json` ajustado em modo CommonJS, o seu arquivo de configuração do Jest volta a ser simples e direto:

```typescript
import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);
const paths = tsconfig?.compilerOptions?.paths ?? {};

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' }),
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
```

---

## 💡 Regras de Ouro para o Dia a Dia

* **Nunca coloque `.js` nos imports locais:** Escreva sempre `import { Service } from './service'` e não `import { Service } from './service.js'`.
* **Mantenha o `rootDir` definido:** Ao criar novos projetos NestJS, certifique-se de que `"rootDir": "./src"` está presente no `tsconfig.json`.
* **Erros `ENOENT: uv_cwd`:** São erros do terminal quando a pasta onde ele estava aberto foi modificada ou reinstalada. Basta dar `cd ..` e entrar na pasta novamente.