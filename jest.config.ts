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

  // 1. Remove a extensão .js dos imports em tempo de teste
  moduleNameMapper: {
    '^(\\.\\.?/.*)\\.js$': '$1',
    ...pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' }),
  },

  // 2. Configura o ts-jest para transpilar tanto .ts quanto .js
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.json',
        useESM: false, // Mantém CommonJS para o Jest consumir sem reclamar de ESM
      },
    ],
  },

  // 3. Libera o Jest para transpilar o código do @nestjs
  transformIgnorePatterns: ['node_modules/(?!@nestjs/)'],

  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
