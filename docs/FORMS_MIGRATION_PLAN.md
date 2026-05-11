# Forms Migration Plan: react-hook-form + zod (shared web ↔ native)

Migrate all form handling in `@repo/app` (web/Next.js) and `@repo/native` (Expo) from ad-hoc `useState` to **react-hook-form + zod**, with validation schemas shared between both platforms via `@repo/salon-core`.

---

## 1. What we already have vs. what's missing

|                           | Web (`apps/app`)                                                                 | Native (`apps/native`)                       |
| ------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------- |
| `zod`                     | ✅ `^3.24.1` (only used in `env.ts` + push route)                                | ❌                                           |
| `react-hook-form`         | ✅ via `@repo/ui` `^7.54.1`                                                      | ❌                                           |
| `@hookform/resolvers`     | ❌                                                                               | ❌                                           |
| Form abstraction          | shadcn `<Form>` in `packages/ui/src/form.tsx` (already RHF-based, unused so far) | none — bespoke `<Input>` with `onChangeText` |
| Shared validation helpers | `@repo/salon-core/phone` (`normalizePhone`), no schemas                          | same                                         |

Forms currently using `useState` (15 total, ~2.8k LOC):

- **Web:** `client-drawer`, `staff-drawer`, `service-drawer`, `appointment-drawer`, `availability-drawer`, `staff-schedule-drawer`, `appointment-detail-drawer`, `client-picker`, `signup`, `login`, `onboarding`, `today/page`, `staff/page`, `clients/page`, `settings/page`.
- **Native:** `login`, `signup`, `staff`, `appointment-create-modal`, plus calendar pickers.

---

## 2. Architecture: where shared code lives

**`@repo/salon-core/forms/`** (new subdir — same package already exports `phone`, `types`, etc.; platform-agnostic, no React imports).

```
packages/salon-core/src/forms/
  ├─ messages.ts         # Farsi error strings (single source of truth)
  ├─ primitives.ts       # zod.string().refine(...) helpers: phoneSchema, jalaliDateSchema, hexColorSchema, durationMinutesSchema, persianDigitsSchema
  ├─ client.ts           # clientCreateSchema, clientUpdateSchema, ClientFormValues = z.infer<...>
  ├─ staff.ts            # staffCreateSchema, staffScheduleSchema
  ├─ service.ts
  ├─ appointment.ts      # incl. cross-field rules (end > start, conflict-free is server-side only)
  ├─ auth.ts             # loginSchema, signupSchema (reuse normalizePhone in transform)
  └─ index.ts
```

Rules for this dir:

- **Zero React, zero RHF, zero DOM/RN imports.** Pure zod + existing `salon-core` helpers (`normalizePhone`, `parseJalali`, `appointment-time`).
- Use `z.preprocess` / `.transform` so the schema both **validates and normalizes** (e.g. phone is stored normalized regardless of what user typed). API request types come from `z.infer<typeof xxxSchema>`.
- Export both `Input` and `Output` types where preprocessing changes shape: `type ClientFormInput = z.input<typeof clientCreateSchema>`, `type ClientFormPayload = z.output<typeof clientCreateSchema>`.

**`@repo/ui/form.tsx`** already wires RHF + Tailwind/shadcn — keep it; this is the web-side glue.

**Native form glue** lives in `apps/native/components/ui/form.tsx` (new). It's tiny (~80 LOC): `FormProvider` re-export plus a `<FormField>` that wraps `Controller` and renders our `Input`/`Label`/error `Text`. RN can't share the web `<Form>` because the primitives are different — but the **schemas and types** are shared, which is what matters.

---

## 3. Dependency changes

- `packages/salon-core/package.json`: `"zod": "^3.24.1"`.
- `apps/native/package.json`: `"react-hook-form": "^7.54.1"`, `"zod": "^3.24.1"`, `"@hookform/resolvers": "^3.9.1"`.
- `apps/app/package.json`: add `"@hookform/resolvers": "^3.9.1"` (already has zod + RHF via UI).
- `packages/ui/package.json`: keep resolver out — consumers import it directly.
- Lock zod major in root `pnpm.overrides` to avoid two copies in the native bundle.

---

## 4. Web migration pattern (per form)

**Before** (`client-drawer.tsx`):

```tsx
const [name, setName] = useState('')
const [phone, setPhone] = useState('')
// ... handleSubmit with manual try/catch + setError
```

**After:**

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@repo/ui/form'
import {
  clientFormSchema,
  type ClientFormInput,
} from '@repo/salon-core/forms/client'

const form = useForm<ClientFormInput>({
  resolver: zodResolver(clientFormSchema),
  defaultValues: client ? toFormValues(client) : emptyClient,
})

useEffect(() => {
  if (open) form.reset(client ? toFormValues(client) : emptyClient)
}, [open, client])

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await (isEditing
      ? dataClient.clients.update(client.id, values)
      : dataClient.clients.create(values))
    onSuccess()
  } catch (err) {
    form.setError('root', { message: humanize(err) })
  }
})
```

The `FormField` renders the existing `<Input>` — no UI rewrite needed. Loading state becomes `form.formState.isSubmitting`. Server errors go to `root` and render via `FormMessage` or a single banner.

---

## 5. Native migration pattern

Because RN inputs use `onChangeText` (not `onChange`), we wrap once:

```tsx
// apps/native/components/ui/form-field.tsx
export function FormTextField<T extends FieldValues>({
  name,
  control,
  label,
  ...inputProps
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <View style={styles.field}>
          <Label>{label}</Label>
          <Input
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            {...inputProps}
          />
          {fieldState.error && (
            <Text style={styles.error}>{fieldState.error.message}</Text>
          )}
        </View>
      )}
    />
  )
}
```

Also `FormSelectField`, `FormJalaliDateField`, `FormTimeField`, `FormChipGroupField` (for the tag picker). Each one is a thin Controller wrapper around primitives we already have in `apps/native/components/ui/`.

**Status (live):** `apps/native/components/ui/form-field.tsx` exists and currently exports:

- ✅ `FormTextField` — `Controller` + `Label` + `Input` + inline error
- ✅ `FormRootError` — renders `errors.root.message` (form-level server errors)

All native field wrappers landed up-front in `apps/native/components/ui/form-field.tsx`:

- [x] `FormSelectField` — wraps `components/ui/select.tsx`
- [x] `FormJalaliDateField` — wraps `components/ui/jalali-date-picker.tsx` (stores Gregorian `YYYY-MM-DD`)
- [x] `FormTimeField` — wraps `components/ui/time-picker.tsx` (`HH:MM`)
- [x] `FormChipGroupField` — multi-select chip picker with optional `maxSelected`
- [x] `FormSwitchField` / `FormCheckboxField` (alias) — boolean toggles, RN built-in `Switch`
- [x] `FormPhoneField` — `Input` preset with `keyboardType="phone-pad"` + `displayPhone`/`normalizePhone` round-trip

Then `apps/native/app/login.tsx` collapses from ~190 to ~110 lines:

```tsx
const {
  control,
  handleSubmit,
  formState: { isSubmitting },
  setError,
} = useForm({
  resolver: zodResolver(loginSchema),
  defaultValues: { phone: '', password: '' },
})
const onSubmit = handleSubmit(async (v) => {
  try {
    await login(v)
  } catch (e) {
    setError('root', { message: humanize(e) })
  }
})
// <FormTextField name="phone" control={control} ... />
```

---

## 6. Migration order

Each row = one PR-sized step, runnable independently.

1. **Foundation** — add deps; scaffold `salon-core/forms/messages.ts` + `primitives.ts` (phone, jalali, hexColor, persianDigits) with unit tests in `salon-core` (Vitest, already wired).
2. **Auth schemas** (`loginSchema`, `signupSchema`) — small surface, both platforms use them. Migrate `apps/app/app/login` + `apps/native/app/login` together to prove the pattern end-to-end.
3. **Native form glue** — `FormTextField`/`FormSelectField`/etc., styleguide entry. Migrate `apps/native/app/signup`. ✅ Glue (`FormTextField`, `FormRootError`) lives in `apps/native/components/ui/form-field.tsx`; `apps/native/app/signup.tsx` has no form (deep-links to web signup), so no migration needed. Further field wrappers land with the screens that introduce them (per section 5).
4. **Client schema** — migrate `apps/app/components/clients/client-drawer` + any native client form. ✅ `salon-core/forms/client.ts` (with tests) + `client-drawer.tsx` on RHF/zod. Native `client-picker` mini-form deferred to phase 7 (calendar/appointment scope).
5. **Staff schema** — `staff-drawer`, `staff-schedule-drawer`, `apps/native/app/staff`. ✅ `salon-core/forms/staff.ts` (`staffCreateSchema`, `staffScheduleSchema`) + new `timeOfDaySchema` primitive, with tests. Web `staff-drawer.tsx` and `staff-schedule-drawer.tsx` on RHF/zod (`useFieldArray` for the weekly rows). Native `app/staff.tsx` is a list/search screen with no form — nothing to migrate.
6. **Service schema** — `service-drawer` + native service screens. ✅ `salon-core/forms/service.ts` (with tests) + web `service-drawer.tsx` on RHF/zod. Native currently has a read-only `ServicesCard` and no service create/edit form to migrate.
7. **Appointment schema** — biggest one (`appointment-drawer.tsx` 614 LOC, `appointment-create-modal.tsx` 643 LOC). ✅ `salon-core/forms/appointment.ts` (with tests) now validates regular vs temporary clients, required staff/service, Gregorian persisted dates, Persian-digit times/durations, and end > start. Web `appointment-drawer.tsx`, native `appointment-create-modal.tsx`, `@repo/api-client` create types, and the web create route now use the shared schema/payload.
8. **Cleanup** — ✅ remove dead server-error state and unify root error rendering via `<FormRootError>` on each side. Web exports `FormRootError` from `@repo/ui/form`; native exports it from `apps/native/components/ui/form-field.tsx`.

---

## 7. API / type alignment

`@repo/api-client` and route handlers currently take loose request types. After migration, **server routes can `import { clientCreateSchema } from '@repo/salon-core/forms/client'` and `.parse()` the body** — same schema, both sides validate. This removes duplicated request types in `@repo/api-client` and is the biggest payoff.

---

## 8. Tests

- Unit-test every schema in `salon-core/forms/__tests__/*.test.ts` (covers Farsi-digit phone normalization, jalali edge dates, end-before-start, etc.).
- Existing Playwright (`@repo/app`) and unit suites should pass unchanged — UI structure doesn't move, only state management does.

---

## 9. Risks / gotchas

- **`zod` minor versions:** lock to a single major in workspace root `overrides` to avoid two copies in the native bundle.
- **Date inputs:** `jalali-date-picker` likely exposes a Date object — schema should accept either ISO string or Date via `z.union`, then transform.
- **Phone normalization timing:** keep raw input as form state (`displayPhone(field.value)` on render); normalize in schema's `.transform` so on submit the payload is canonical, but the user keeps seeing what they typed. The current `client-drawer:163` already does `setPhone(normalizePhone(...))` eagerly — moving normalization to schema-level is a small semantic change, worth verifying.
- **Native bundle size:** RHF is ~9 KB gzipped, zod ~13 KB. Acceptable.
- **`@repo/ui/form` is `'use client'`** — fine for Next.js app router. Won't be imported from native.

---

## 10. Deliverable checklist

- [x] `salon-core/forms/*` schemas + tests
- [x] `@hookform/resolvers` added to both apps
- [x] `apps/native/components/ui/form-field.tsx` glue — `FormTextField`, `FormRootError`
- [x] Native field wrappers: `FormSelectField`, `FormJalaliDateField`, `FormTimeField`, `FormChipGroupField`, `FormSwitchField`/`FormCheckboxField`, `FormPhoneField`
- [x] 15 forms migrated (track by file in PR description)
- [x] Server routes adopt schemas (`route.ts` files in `apps/app/app/api/**` for form-backed request bodies)
- [x] Remove ad-hoc request types from `@repo/api-client` that are now `z.infer`-derived
- [x] Phase 8 cleanup — web/native root errors render through `FormRootError`
