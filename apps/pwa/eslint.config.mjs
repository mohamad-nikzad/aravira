import baseConfig from '@repo/eslint-config/base'
import reactConfig from '@repo/eslint-config/react'

const config = [
  ...baseConfig,
  ...reactConfig,
  {
    ignores: ['dist/**', 'node_modules/**', 'public/sw.js'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/incompatible-library': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['../../apps/*', '../*/app/*'],
        },
      ],
    },
  },
]

export default config
