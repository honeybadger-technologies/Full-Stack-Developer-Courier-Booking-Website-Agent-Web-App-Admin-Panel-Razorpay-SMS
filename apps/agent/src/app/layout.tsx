import './global.css';

export const metadata = {
  title: 'Courier Agent | Pickup Management',
  description: 'Courier booking platform agent app for pickup management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
