module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Где искать тесты
  roots: ['<rootDir>/src', '<rootDir>/test'],

  // Паттерны для поиска тестов
  testMatch: [
    // Unit тесты (рядом с кодом)
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.test.ts',

    // E2E тесты
    '<rootDir>/test/**/*.e2e-spec.ts',
    '<rootDir>/test/*.e2e-test.ts',

    // Интеграционные тесты
    '<rootDir>/test/**/*.integration-spec.ts',
  ],

  // Настройка TypeScript
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },

  // Игнорируем
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '.d.ts$'],

  // Для корректных импортов
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },

  // Отчет о покрытии
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
  ],

  // Минимальное покрытие
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
