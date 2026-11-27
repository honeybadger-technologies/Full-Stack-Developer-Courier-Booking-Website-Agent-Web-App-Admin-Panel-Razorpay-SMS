import AdminLayout from './layout-admin'
import './styles/globals.css'

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
      <body>
        <AdminLayout>{children}</AdminLayout>
      </body>
    </html>
  )
}
