import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextVitals,
  {
    ignores: [
      '.next/**',
      '**/.next/**',
      '.turbo/**',
      '**/.turbo/**',
      '.vercel/**',
      'node_modules/**',
      'tsconfig.tsbuildinfo',
      'bun.lock',
      'public/sw.js',
      'public/icons/**',
    ],
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
