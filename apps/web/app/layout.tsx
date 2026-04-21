import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aravira',
  description: 'Aravira salon scheduling and management platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  )
}
