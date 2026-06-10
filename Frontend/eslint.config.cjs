// Migrate to ESLint flat config format (eslint 9+)
const { FlatCompat } = require('@eslint/eslintrc');
// Provide ESLint built-in configs so FlatCompat can resolve `eslint:recommended` / `eslint:all`.
// @eslint/js exports the standard ESLint configs (recommended, all, etc.).
const js = require('@eslint/js');
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  // keep ignored files
  { ignores: ['dist', '.eslintrc.cjs', 'eslint.config.cjs'] },

  // Ensure type-aware rules have parserOptions available when configs are loaded.
  // Place a top-level languageOptions entry so rules that require type information
  // (from extends like plugin:@typescript-eslint/recommended-type-checked) see
  // parserOptions.project during load.
  {
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json', './tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: __dirname,
      },
      // env: { browser: true, es2020: true },
    },
  },

  // reuse legacy shareable configs via FlatCompat
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended'
  ),

  // project-wide rules and language options
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json', './tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: __dirname,
      },
      // env: { browser: true, es2020: true },
    },
    plugins: {
      'react-refresh': require('eslint-plugin-react-refresh'),
    },
    rules: {
      // 'react-refresh/only-export-components': [
      //   'warn',
      //   { allowConstantExport: true },
      // ],
      'react-hooks/exhaustive-deps': 'warn',
      'prefer-const': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-pascal-case': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      // '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];