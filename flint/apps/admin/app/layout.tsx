import { Inter } from 'next/font/google'
import AdminLayout from './layout-admin'
import './styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Courier Admin - Management Panel',
  description: 'Admin panel for courier booking management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AdminLayout>{children}</AdminLayout>
      </body>
    </html>
  )
}
