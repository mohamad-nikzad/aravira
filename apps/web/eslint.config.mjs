import baseConfig from '@repo/eslint-config/base'
import nextConfig from '@repo/eslint-config/next'
import eslintPluginAstro from 'eslint-plugin-astro'

const config = [
  ...baseConfig,
  ...eslintPluginAstro.configs.recommended,
  ...nextConfig.map((block) => ({
    ...block,
    files: block.files ?? ['**/*.{ts,tsx,js,jsx}'],
  })),
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx,astro}'],
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
    files: ['**/*.astro'],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
]

export default config
