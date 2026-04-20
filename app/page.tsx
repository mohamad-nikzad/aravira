import type { Metadata } from 'next'
import Image from 'next/image'
import { Lalezar, Vazirmatn } from 'next/font/google'
import {
  BellRing,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  Scissors,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

const displayFont = Lalezar({
  subsets: ['arabic', 'latin'],
  weight: '400',
})

const bodyFont = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-landing-body',
})

export const metadata: Metadata = {
  title: 'آراویرا | مدیریت نوبت‌دهی سالن زیبایی',
  description:
    'آراویرا نرم‌افزار مدیریت نوبت‌ها، مشتریان، خدمات و پرسنل برای سالن‌های زیبایی است.',
}

type Feature = {
  title: string
  text: string
  icon: LucideIcon
}

const features: Feature[] = [
  {
    title: 'تقویم دقیق نوبت‌ها',
    text: 'روز کاری سالن را بر اساس پرسنل، ساعت و وضعیت هر نوبت مرتب ببینید.',
    icon: CalendarDays,
  },
  {
    title: 'مشتری‌های همیشه آماده',
    text: 'شماره تماس، یادداشت‌ها و سابقه مراجعه هر مشتری کنار نوبت‌هایش می‌ماند.',
    icon: UsersRound,
  },
  {
    title: 'خدمات و پرسنل منظم',
    text: 'برای هر خدمت زمان، قیمت و مجری مشخص کنید تا ثبت نوبت سریع‌تر شود.',
    icon: Scissors,
  },
]

const rhythms = [
  'نوبت تازه',
  'تغییر ساعت',
  'لغو شده',
  'انجام شد',
  'یادداشت مشتری',
]

const schedule = [
  { time: '۱۰:۰۰', name: 'رنگ مو', person: 'نازنین', state: 'در انتظار' },
  { time: '۱۲:۳۰', name: 'کوتاهی و براشینگ', person: 'مهسا', state: 'قطعی' },
  { time: '۱۵:۱۵', name: 'مانیکور', person: 'سارا', state: 'یادآوری' },
]

const workflow = [
  'ثبت سریع مشتری و شماره تماس',
  'انتخاب خدمت، زمان و پرسنل',
  'کنترل تداخل نوبت‌ها',
  'پیگیری برنامه روزانه سالن',
]

export default function LandingPage() {
  return (
    <main
      dir="ltr"
      className={`${bodyFont.className} aravira-landing box-border min-h-dvh overflow-hidden bg-[#fbf7f9] text-[#1d2520]`}
    >
      <style>{`
        .aravira-landing {
          max-width: 100%;
          overflow-x: hidden;
        }

        @keyframes aravira-petal-fall {
          0% { transform: translate3d(0, -12px, 0) rotate(0deg); opacity: 0; }
          12% { opacity: 0.78; }
          100% { transform: translate3d(-78px, 520px, 0) rotate(-250deg); opacity: 0; }
        }

        @media (prefers-reduced-motion: no-preference) {
          .aravira-petal {
            animation: aravira-petal-fall 13s linear infinite;
          }
        }
      `}</style>

      <section
        id="top"
        className="relative isolate min-h-[88svh] overflow-hidden bg-[#172119] text-white"
      >
        <Image
          src="/landing/sakura-hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(14,22,16,0.94)_0%,rgba(28,41,31,0.76)_43%,rgba(120,47,65,0.26)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-[linear-gradient(0deg,#fbf7f9_0%,rgba(251,247,249,0)_100%)]" />

        <span className="aravira-petal absolute right-[14%] top-14 h-5 w-3 rotate-45 rounded-[8px] bg-[#f6bcc9]/80" />
        <span className="aravira-petal absolute right-[34%] top-2 h-4 w-2 rotate-12 rounded-[8px] bg-[#f9d4dc]/80 [animation-delay:2.7s]" />
        <span className="aravira-petal absolute right-[58%] top-20 h-5 w-3 -rotate-12 rounded-[8px] bg-[#f4aebf]/70 [animation-delay:5.2s]" />
        <span className="aravira-petal absolute right-[76%] top-8 h-4 w-2 rotate-45 rounded-[8px] bg-[#fff1f4]/80 [animation-delay:8s]" />

        <header className="mx-auto flex w-full max-w-7xl flex-row-reverse box-border items-center justify-between px-5 py-5 sm:px-8">
          <a href="#top" dir="rtl" className="flex items-center gap-3" aria-label="آراویرا">
            <span className="grid h-11 w-11 place-items-center rounded-lg border border-white/30 bg-white/12 backdrop-blur">
              <Image
                src="/icon.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </span>
            <span className={`${displayFont.className} text-3xl leading-none`}>آراویرا</span>
          </a>

          <nav dir="rtl" className="hidden items-center gap-7 text-sm text-white/86 md:flex">
            <a href="#features" className="transition hover:text-white">
              امکانات
            </a>
            <a href="#daily-flow" className="transition hover:text-white">
              روز کاری
            </a>
            <a href="#start" className="transition hover:text-white">
              شروع
            </a>
          </nav>

          <a
            href="/login"
            className="rounded-md border border-white/35 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-[#1d2520]"
          >
            ورود
          </a>
        </header>

        <div className="mx-auto grid w-full max-w-7xl box-border items-center gap-10 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:pb-24 lg:pt-20">
          <div dir="rtl" className="w-full min-w-0 max-w-3xl text-right lg:order-2">
            <p className="mb-5 inline-flex rounded-md border border-white/24 bg-white/12 px-4 py-2 text-sm font-semibold text-[#ffe3ea] backdrop-blur">
              مدیریت نوبت‌دهی برای سالن‌های زیبایی
            </p>
            <h1
              className={`${displayFont.className} max-w-full text-4xl leading-[1.14] text-white sm:text-6xl lg:text-[5.25rem] lg:leading-[1.08]`}
            >
              روز شلوغ سالن، آرام مثل شکوفه گیلاس.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/82 sm:text-lg">
              آراویرا نوبت‌ها، مشتریان، پرسنل و خدمات سالن را در یک مسیر مرتب
              نگه می‌دارد تا مدیر سالن با تمرکز بیشتری روز کاری را جلو ببرد.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="/signup"
                className="rounded-md bg-[#c3425b] px-6 py-3 text-center text-base font-bold text-white shadow-[0_16px_40px_rgba(124,28,48,0.32)] transition hover:bg-[#ad334b]"
              >
                ساخت حساب مدیر
              </a>
              <a
                href="/login"
                className="rounded-md border border-white/32 bg-white/10 px-6 py-3 text-center text-base font-bold text-white backdrop-blur transition hover:bg-white hover:text-[#1d2520]"
              >
                ورود به پنل
              </a>
            </div>
          </div>

          <div dir="rtl" className="relative hidden min-h-[480px] lg:order-1 lg:block" aria-hidden="true">
            <div className="absolute left-0 top-0 w-[420px] rounded-lg border border-white/24 bg-[#f7faf1]/92 p-4 text-[#1d2520] shadow-[0_30px_80px_rgba(8,12,9,0.36)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between border-b border-[#d9dfd0] pb-3">
                <div>
                  <p className="text-sm font-bold text-[#8c2f43]">تقویم امروز</p>
                  <p className="mt-1 text-xs text-[#5d665c]">سه‌شنبه، سالن مرکزی</p>
                </div>
                <span className="rounded-md bg-[#24362a] px-3 py-1 text-xs font-bold text-white">
                  زنده
                </span>
              </div>
              <div className="space-y-3">
                {schedule.map((item) => (
                  <div
                    key={item.time}
                    className="grid grid-cols-[64px_1fr] gap-3 rounded-md border border-[#dfe5d8] bg-white p-3"
                  >
                    <span className="font-bold text-[#8c2f43]" dir="ltr">
                      {item.time}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold">{item.name}</p>
                      <p className="mt-1 text-xs text-[#657060]">
                        {item.person} · {item.state}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-3 right-4 w-[300px] rounded-lg border border-white/20 bg-[#24362a] p-5 text-white shadow-[0_26px_70px_rgba(8,12,9,0.35)]">
              <p className="text-sm text-[#ffcdd7]">نبض روزانه</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {rhythms.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-white/12 bg-white/8 px-3 py-2 text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" dir="rtl" className="relative bg-[#fbf7f9] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold text-[#9b3348]">برای مدیریت سالن</p>
            <h2
              className={`${displayFont.className} mt-3 text-4xl leading-tight text-[#1d2520] sm:text-5xl`}
            >
              هر نوبت سر جای خودش می‌نشیند.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#606a62]">
              از اولین تماس مشتری تا پایان خدمت، اطلاعات سالن پراکنده نمی‌ماند.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon

              return (
                <article
                  key={feature.title}
                  className="rounded-lg border border-[#ead9de] bg-white p-6 shadow-[0_18px_50px_rgba(95,45,56,0.07)]"
                >
                  <div className="mb-8 grid h-12 w-12 place-items-center rounded-lg bg-[#24362a] text-[#ffdce4]">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-extrabold text-[#1d2520]">{feature.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#626b62]">{feature.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="daily-flow"
        dir="rtl"
        className="relative overflow-hidden bg-[#24362a] px-5 py-20 text-white sm:px-8"
      >
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:68px_68px]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-extrabold text-[#ffc7d2]">روز کاری بدون سردرگمی</p>
            <h2
              className={`${displayFont.className} mt-3 text-4xl leading-tight sm:text-5xl`}
            >
              مدیر، پذیرش و پرسنل یک تصویر مشترک دارند.
            </h2>
            <p className="mt-6 text-base leading-8 text-white/76">
              وقتی ساعت‌ها، خدمات و مسئول هر نوبت روشن باشد، تماس‌های تکراری و
              جا‌به‌جایی‌های ناگهانی کمتر وقت سالن را می‌گیرند.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/14 bg-white/8 p-5">
                <ClipboardCheck className="mb-4 h-6 w-6 text-[#ffc7d2]" aria-hidden="true" />
                <p className="text-3xl font-black">۳ دقیقه</p>
                <p className="mt-2 text-sm leading-7 text-white/70">برای ثبت یک نوبت کامل</p>
              </div>
              <div className="rounded-lg border border-white/14 bg-white/8 p-5">
                <ChartNoAxesCombined className="mb-4 h-6 w-6 text-[#b8d1b2]" aria-hidden="true" />
                <p className="text-3xl font-black">۱ تقویم</p>
                <p className="mt-2 text-sm leading-7 text-white/70">برای هماهنگی کل تیم سالن</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr] md:items-stretch">
            <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-white/18">
              <Image
                src="/landing/salon-detail.webp"
                alt="فضای داخلی یک سالن زیبایی"
                fill
                sizes="(min-width: 1024px) 35vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(36,54,42,0.72)_0%,rgba(36,54,42,0.08)_68%)]" />
              <p className="absolute bottom-5 right-5 max-w-[240px] text-lg font-extrabold leading-8">
                سالن با برنامه روشن، تجربه آرام‌تری می‌سازد.
              </p>
            </div>

            <div className="rounded-lg border border-white/16 bg-[#f7faf1] p-5 text-[#1d2520]">
              <div className="flex items-center justify-between border-b border-[#dce3d4] pb-4">
                <div>
                  <p className="text-sm font-extrabold text-[#9b3348]">جریان ثبت نوبت</p>
                  <p className="mt-1 text-xs text-[#657060]">از تماس تا پایان خدمت</p>
                </div>
                <BellRing className="h-6 w-6 text-[#9b3348]" aria-hidden="true" />
              </div>

              <ol className="mt-5 space-y-4">
                {workflow.map((item, index) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#c3425b] text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <span className="pt-1 text-sm font-bold leading-7">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section id="start" dir="rtl" className="bg-[#f7faf1] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 border-y border-[#d8e1d0] py-14 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold text-[#9b3348]">شروع آراویرا</p>
              <h2
                className={`${displayFont.className} mt-3 text-4xl leading-tight text-[#1d2520] sm:text-5xl`}
              >
                سالن خود را بسازید و اولین نوبت را ثبت کنید.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#606a62]">
                حساب مدیر، خدمات، پرسنل و ساعت کاری را اضافه کنید؛ بعد تقویم
                سالن برای استفاده روزانه آماده است.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href="/signup"
                className="rounded-md bg-[#24362a] px-7 py-3 text-center text-base font-bold text-white transition hover:bg-[#1a281f]"
              >
                ساخت حساب مدیر
              </a>
              <a
                href="/login"
                className="rounded-md border border-[#24362a]/25 px-7 py-3 text-center text-base font-bold text-[#24362a] transition hover:border-[#24362a] hover:bg-white"
              >
                حساب دارم
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
