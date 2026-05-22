import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Phone } from 'lucide-react'
import type { Service } from '@repo/salon-core/types'
import { serviceCategoryName } from '@repo/salon-core/service-catalog'
import { toPersianDigits } from '@repo/salon-core/persian-digits'
import {
  fetchPublicSalon,
  PublicApiError,
  type PublicSalonView,
} from '../_lib/public-api'
import { formatDuration, formatPrice } from '../_lib/format'

export const dynamic = 'force-dynamic'

type Params = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  try {
    const view = await fetchPublicSalon(slug)
    return {
      title: `${view.salon.name} | سالورا`,
      description: view.publicSettings.bioText ?? undefined,
    }
  } catch {
    return { title: 'سالن یافت نشد | سالورا' }
  }
}

export default async function PublicSalonPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  let view: PublicSalonView
  try {
    view = await fetchPublicSalon(slug)
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) notFound()
    throw error
  }

  const accent = view.publicSettings.accentColor ?? '#c3425b'
  const groups = groupByCategory(view.services)
  const bookingEnabled = view.publicSettings.appointmentRequestsEnabled

  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-[#fdf5f8] text-[#3f2730]"
      style={{ ['--salon-accent' as never]: accent }}
    >
      <SalonHeader view={view} />

      <section className="mx-auto w-full max-w-3xl px-5 pb-24 sm:px-8">
        {!bookingEnabled ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
            در حال حاضر امکان رزرو آنلاین در این سالن غیرفعال است. لطفاً برای
            هماهنگی نوبت با سالن تماس بگیرید.
          </div>
        ) : null}

        {view.services.length === 0 ? (
          <p className="rounded-2xl border border-[#f3d5dd] bg-white/80 p-6 text-center text-sm text-[#6b4955]">
            خدمتی برای نمایش وجود ندارد.
          </p>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.key}>
                <h2 className="mb-3 text-base font-extrabold text-[#7a2a40]">
                  {group.label}
                </h2>
                <ul className="space-y-3">
                  {group.services.map((service) => (
                    <li
                      key={service.id}
                      className="flex flex-col gap-3 rounded-2xl border border-[#f3d5dd] bg-white/85 p-4 shadow-[0_10px_30px_rgba(155,51,72,0.06)] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-base font-extrabold text-[#3f2730]">
                          {service.name}
                        </p>
                        <p className="mt-1 text-xs text-[#8b6b73]">
                          {formatDuration(service.duration)} ·{' '}
                          {formatPrice(service.price)}
                        </p>
                        {service.description ? (
                          <p className="mt-2 text-xs leading-6 text-[#6b4955]">
                            {service.description}
                          </p>
                        ) : null}
                      </div>
                      {bookingEnabled ? (
                        <Link
                          href={`/salons/${view.salon.slug}/book/${service.id}`}
                          className="inline-flex justify-center rounded-md px-5 py-2 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(124,28,48,0.22)] transition hover:opacity-90"
                          style={{ backgroundColor: 'var(--salon-accent)' }}
                        >
                          رزرو
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function SalonHeader({ view }: { view: PublicSalonView }) {
  const { salon, publicSettings } = view
  return (
    <header className="relative isolate">
      {publicSettings.bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={publicSettings.bannerUrl}
          alt=""
          className="h-48 w-full object-cover sm:h-64"
        />
      ) : (
        <div
          className="h-32 w-full"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in oklch, var(--salon-accent) 30%, #fdf5f8) 0%, #fdf5f8 100%)',
          }}
        />
      )}
      <div className="mx-auto -mt-12 w-full max-w-3xl px-5 sm:px-8">
        <div className="rounded-3xl border border-[#f3d5dd] bg-white/90 p-5 shadow-[0_18px_50px_rgba(155,51,72,0.08)] backdrop-blur sm:p-6">
          <div className="flex items-start gap-4">
            {publicSettings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={publicSettings.logoUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-2xl border border-[#f3d5dd] bg-white object-cover sm:h-20 sm:w-20"
              />
            ) : (
              <div
                className="h-16 w-16 shrink-0 rounded-2xl sm:h-20 sm:w-20"
                style={{ backgroundColor: 'var(--salon-accent)', opacity: 0.15 }}
              />
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold text-[#3f2730] sm:text-2xl">
                {salon.name}
              </h1>
              {salon.phone ? (
                <a
                  href={`tel:${salon.phone}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#7a2a40] hover:underline"
                  dir="ltr"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {toPersianDigits(salon.phone)}
                </a>
              ) : null}
            </div>
          </div>
          {publicSettings.bioText ? (
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#6b4955]">
              {publicSettings.bioText}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  )
}

function groupByCategory(services: Service[]) {
  const groups = new Map<string, { key: string; label: string; services: Service[] }>()
  for (const service of services) {
    const label = serviceCategoryName(service)
    const key = service.categoryId ?? service.category
    if (!groups.has(key)) groups.set(key, { key, label, services: [] })
    groups.get(key)!.services.push(service)
  }
  return Array.from(groups.values())
}
