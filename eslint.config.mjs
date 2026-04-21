import baseConfig from '@repo/eslint-config/base'
import nextConfig from '@repo/eslint-config/next'

const config = [
  ...baseConfig,
  ...nextConfig,
  {
    ignores: [
      '.next/**',
      '**/.next/**',
      '.turbo/**',
      '**/.turbo/**',
      '.vercel/**',
      'node_modules/**',
      'tsconfig.tsbuildinfo',
      'public/sw.js',
      'public/icons/**',
    ],
  },
  {
    files: ['apps/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['../../apps/*', '../*/app/*'],
        },
      ],
    },
  },
  {
    rules: {
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default config
