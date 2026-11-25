import { Inter } from 'next/font/google'
import './styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Courier Agent - Pickup Dashboard',
  description: 'Agent web app for parcel pickups',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} mobile-only`}>
        {children}
      </body>
    </html>
  )
}
