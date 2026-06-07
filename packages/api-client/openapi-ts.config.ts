import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: '../api-contract/openapi.json',
  output: 'src/generated',
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
    {
      name: '@tanstack/react-query',
      queryOptions: true,
      queryKeys: true,
      mutationOptions: true,
    },
  ],
})
