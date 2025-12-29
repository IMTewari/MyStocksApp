
export const metadata = { title: 'India Portfolio Coach — Web' };
export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en">
      <body style={{fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial', background:'#fafafa', color:'#111'}}>
        {children}
      </body>
    </html>
  );
}
