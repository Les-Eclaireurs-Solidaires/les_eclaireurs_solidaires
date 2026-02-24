export default {
  preset: 'ts-jest/presets/default-esm', // Utilise le preset ESM
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // Magie : transforme les imports .js en .ts pour les tests
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};
