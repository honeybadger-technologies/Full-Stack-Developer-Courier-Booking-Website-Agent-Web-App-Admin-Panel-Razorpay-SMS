import type { Metadata } from 'next'
import './styles/globals.css'
import CustomerLayoutClient from './customer-layout-client'

export const metadata: Metadata = {
  title: 'Courier Booking',
  description: 'Courier Booking Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <CustomerLayoutClient>{children}</CustomerLayoutClient>
      </body>
    </html>
  )
}