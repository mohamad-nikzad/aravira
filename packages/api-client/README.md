# @repo/api-client

Shared API client for Saluna apps. During Phases 1–6 the root export remains the **legacy** hand-written client; generated SDK/types/query options are available via subpath exports.

## Generated output (`src/generated/`)

**Do not edit files under `src/generated/` manually.** They are produced by [Hey API](https://heyapi.dev/) from `packages/api-contract/openapi.json`.

HeyAPI clears the output directory on each run, so do not add hand-maintained files there.

Regenerate from the repo root:

```bash
pnpm generate:api-client
```

Or from this package:

```bash
pnpm generate
```

Prerequisite: regenerate the OpenAPI contract when API routes change (`pnpm generate:api-contract`).

## Subpath exports (generated)

| Export | File |
|--------|------|
| `@repo/api-client/sdk` | `src/generated/sdk.gen.ts` |
| `@repo/api-client/query` | `src/generated/@tanstack/react-query.gen.ts` |
| `@repo/api-client/types` | `src/generated/types.gen.ts` |

Legacy usage is unchanged: `import { createApiClient } from '@repo/api-client'`.
