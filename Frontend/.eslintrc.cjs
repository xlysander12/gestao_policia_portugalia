module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    "react-hooks/exhaustive-deps": "off",

    "prefer-const": "warn",

    "@typescript-eslint/no-unused-vars": "off",

    "@typescript-eslint/no-explicit-any": "off",

    "react/react-in-jsx-scope": "off",

    "react/jsx-pascal-case": "warn",

    "@typescript-eslint/no-non-null-asserted-optional-chain": "off"
  },
}
