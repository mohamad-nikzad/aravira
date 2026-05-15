import { Calendar, Clock3, Crown, Plus, UserRound, ChevronLeft, Filter, EllipsisVertical } from 'lucide-react'

const navItems = [
  { label: 'تقویم', icon: Calendar, active: false, x: '14.7%' },
  { label: 'امروز', icon: Clock3, active: true, x: '31.8%' },
  { label: 'مشتریان', icon: UserRound, active: false, x: '68.2%' },
  { label: 'بیشتر', icon: Crown, active: false, x: '85.3%' },
] as const

const todayAppointments = [
  { time: '۰۹:۰۰', client: 'فاطمه رضایی', service: 'کاشت ناخن', staff: 'نیلوفر', status: 'confirmed' as const },
  { time: '۱۰:۰۰', client: 'سارا محمدی', service: 'کاشت ناخن', staff: 'نیلوفر', status: 'confirmed' as const },
  { time: '۱۰:۳۰', client: 'مریم احمدی', service: 'رنگ مو', staff: 'زهرا', status: 'confirmed' as const },
  { time: '۱۱:۰۰', client: 'نرجس غفاری', service: 'کاشت مژه', staff: 'سارا', status: 'confirmed' as const },
  { time: '۱۱:۳۰', client: 'زهرا کریمی', service: 'مانیکور', staff: 'نیلوفر', status: 'confirmed' as const },
  { time: '۱۲:۰۰', client: 'الناز صادقی', service: 'پاکسازی پوست', staff: 'زهرا', status: 'completed' as const },
  { time: '۱۳:۰۰', client: 'نرگس حسینی', service: 'کاشت مژه', staff: 'نیلوفر', status: 'completed' as const },
  { time: '۱۳:۳۰', client: 'مرجان کاظمی', service: 'کاشت ناخن', staff: 'سارا', status: 'completed' as const },
  { time: '۱۴:۰۰', client: 'لیلا کریمی', service: 'مانیکور', staff: 'سارا', status: 'scheduled' as const },
  { time: '۱۴:۳۰', client: 'سمیرا جعفری', service: 'ترمیم ناخن', staff: 'زهرا', status: 'scheduled' as const },
  { time: '۱۵:۰۰', client: 'پریسا کامل', service: 'رنگ مو', staff: 'نیلوفر', status: 'scheduled' as const },
  { time: '۱۶:۰۰', client: 'زهرا موسوی', service: 'پاکسازی پوست', staff: 'زهرا', status: 'scheduled' as const },
  { time: '۱۷:۰۰', client: 'مینا احمدی', service: 'کاشت مژه', staff: 'سارا', status: 'scheduled' as const },
  { time: '۱۸:۰۰', client: 'شیوا صفری', service: 'کاشت ناخن', staff: 'نیلوفر', status: 'scheduled' as const },
]

const statusConfig = {
  confirmed: { bg: '#ECD3D7', text: '#6B3A4A', label: 'تأیید شده' },
  completed: { bg: '#D8EFDF', text: '#287345', label: 'انجام شده' },
  scheduled: { bg: '#F4EFE7', text: '#767A6F', label: 'در انتظار' },
}

function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const c = statusConfig[status]
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-medium leading-none"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  )
}

export default function NavPrototypePage() {
  return (
    <main className="min-h-dvh bg-background font-sans antialiased" dir="rtl">
      <div className="mx-auto flex w-full max-w-[430px] flex-col bg-card shadow-xl h-dvh md:h-auto md:max-h-[calc(100dvh-4rem)] md:my-8 md:rounded-2xl">
        <header className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-primary-foreground">
              آ
            </div>
            <div>
              <h1 className="text-[17px] font-bold leading-tight text-card-foreground">آراویرا</h1>
              <p className="text-[12px] text-muted-foreground">۱۴ اردیبهشت ۱۴۰۵</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
            >
              <UserRound className="size-5" />
            </button>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <EllipsisVertical className="size-5" />
            </button>
          </div>
        </header>

        <div className="flex gap-2.5 px-4 pt-4 pb-2">
          <div className="flex-1 rounded-xl bg-muted p-3">
            <p className="text-[11px] font-medium text-muted-foreground">نوبت‌های امروز</p>
            <p className="mt-0.5 text-[22px] font-bold text-foreground">۵</p>
          </div>
          <div className="flex-1 rounded-xl bg-secondary p-3">
            <p className="text-[11px] font-medium text-secondary-foreground">درآمد امروز</p>
            <p className="mt-0.5 text-[22px] font-bold text-secondary-foreground">۲۸۰٬۰۰۰</p>
          </div>
          <div className="flex-1 rounded-xl bg-muted p-3">
            <p className="text-[11px] font-medium text-muted-foreground">مشتریان</p>
            <p className="mt-0.5 text-[22px] font-bold text-foreground">۱۲</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-2 pt-1">
          <h2 className="text-[15px] font-bold text-foreground">نوبت‌های امروز</h2>
          <button
            type="button"
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--ring)]"
          >
            <Filter className="size-3.5" />
            فیلتر
          </button>
        </div>

        <div className="flex-1 overflow-auto px-4 pb-2">
          <div className="space-y-2">
            {todayAppointments.map((apt, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm"
              >
                <div className="flex w-14 flex-col items-center">
                  <span className="text-[13px] font-bold text-card-foreground">{apt.time}</span>
                  <div className="mt-1 h-1 w-1 rounded-full bg-border" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-semibold text-card-foreground">
                      {apt.client}
                    </span>
                    <StatusBadge status={apt.status} />
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {apt.service}
                    <span className="mx-1">·</span>
                    {apt.staff}
                  </p>
                </div>
                <ChevronLeft className="size-4 shrink-0 text-[var(--ring)]" />
              </div>
            ))}
          </div>
        </div>

        <div className="relative aspect-[1000/245] w-full shrink-0 -mb-[1px]">
          <NavShell />
          <button
            type="button"
            aria-label="افزودن نوبت"
            className="absolute left-1/2 top-[9%] z-30 flex aspect-square w-[14.4%] -translate-x-1/2 items-center justify-center rounded-full border-[6px] border-white bg-[radial-gradient(circle_at_36%_24%,#d9a4b0_0%,#bd6176_48%,#7a3047_100%)] text-white shadow-[0_18px_42px_rgba(103,50,68,0.24),0_5px_14px_rgba(103,50,68,0.14)] outline-none transition-transform active:scale-95"
          >
            <Plus className="size-[46%]" strokeWidth={2.1} />
          </button>
          <nav aria-label="Bottom navigation" className="absolute inset-0 z-20" dir="ltr">
            {navItems.map((item) => (
              <NavButton key={item.label} item={item} />
            ))}
          </nav>
        </div>
      </div>
    </main>
  )
}

function NavShell() {
  return (
    <svg
      className="absolute inset-0 z-10 h-full w-full overflow-visible drop-shadow-[0_22px_34px_rgba(103,50,68,0.09)] dark:drop-shadow-[0_22px_34px_rgba(0,0,0,0.3)]"
      viewBox="0 0 1000 245"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <filter id="soft-inner-glow" x="-4%" y="-10%" width="108%" height="125%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="blur" />
          <feOffset dy="4" result="offsetBlur" />
          <feComposite in="offsetBlur" in2="SourceAlpha" operator="out" result="outerBlur" />
          <feColorMatrix
            in="outerBlur"
            type="matrix"
            values="0 0 0 0 0.67 0 0 0 0 0.31 0 0 0 0 0.43 0 0 0 0.12 0"
          />
          <feBlend in2="SourceGraphic" mode="normal" />
        </filter>
      </defs>
      <path
        d="M88 45H342C386 45 393 85 412 126C433 170 465 185 500 185C535 185 567 170 588 126C607 85 614 45 658 45H912C953 45 982 82 982 133C982 184 953 222 912 222H88C47 222 18 184 18 133C18 82 47 45 88 45Z"
        className="fill-card/80 stroke-border"
        filter="url(#soft-inner-glow)"
      />
      <path
        d="M88 45H342C386 45 393 85 412 126C433 170 465 185 500 185C535 185 567 170 588 126C607 85 614 45 658 45H912C953 45 982 82 982 133C982 184 953 222 912 222H88C47 222 18 184 18 133C18 82 47 45 88 45Z"
        className="stroke-border"
        strokeWidth="3.5"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M90 48H340C384 48 391 90 410 129C432 172 464 188 500 188C536 188 568 172 590 129C609 90 616 48 660 48H910"
        className="stroke-border/40"
        strokeWidth="1.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function NavButton({ item }: { item: (typeof navItems)[number] }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      aria-current={item.active ? 'page' : undefined}
      className="absolute top-[48.7%] flex w-[92px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1.5 text-card-foreground outline-none"
      style={{ left: item.x }}
    >
      <span
        className={
          item.active
            ? 'flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-[0_12px_26px_rgba(194,104,120,0.14)]'
            : 'flex size-11 items-center justify-center text-card-foreground'
        }
      >
        <Icon className="size-7" strokeWidth={item.active ? 2.05 : 1.85} />
      </span>
      <span className="max-w-full truncate text-[13px] font-semibold leading-none tracking-normal text-card-foreground">
        {item.label}
      </span>
    </button>
  )
}
