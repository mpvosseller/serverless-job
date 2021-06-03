module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  extends: [
    'eslint:recommended', // recommended ESLint rules
    'plugin:@typescript-eslint/recommended', // recommended rules from @typescript-eslint/eslint-plugin
    'plugin:@typescript-eslint/recommended-requiring-type-checking', // recommended rules (that require parser) from @typescript-eslint/eslint-plugin
    'plugin:prettier/recommended', // enables eslint-plugin-prettier and eslint-config-prettier. This will display Prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  rules: {
    'dot-notation': 'error',
    '@typescript-eslint/no-implicit-any-catch': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/require-await': 'error',
  },
  overrides: [
    {
      files: ['*.test.*', '**/test/**', '**/__mocks__/**'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
      }
    }
  ],
}
