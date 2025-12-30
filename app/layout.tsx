
export const metadata = { title: "My Stocks App", description: "Portfolio Coach (Zerodha)" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial', margin: 0 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
