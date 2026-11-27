import './styles/globals.css'

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
      <body className="mobile-only">
        {children}
      </body>
    </html>
  )
}
