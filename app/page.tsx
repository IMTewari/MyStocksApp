
import Link from 'next/link';
import { enforceDataContract } from "@/app/lib/portfolio/dataGuard";

export default function Home() {
  return (
    <main>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>My Stocks App</h1>
      <p style={{ marginBottom: 16 }}>Welcome! Start by authenticating with Zerodha.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <a href="/api/kite/login" style={{ padding: '8px 12px', border: '1px solid #444', borderRadius: 6, textDecoration: 'none' }}>Login with Zerodha</a>
        <Link href="/dashboard" style={{ padding: '8px 12px', border: '1px solid #444', borderRadius: 6, textDecoration: 'none' }}>Go to dashboard</Link>
      </div>
    </main>
  );
}
