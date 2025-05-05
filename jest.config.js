module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/api-tests/**/*.test.js', '**/api-tests/**/*.test.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/api-tests/setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/.next/'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
}; 