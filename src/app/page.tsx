'use client';

import Link from 'next/link';
import { useT } from '@/lib/lang';

export default function HomePage() {
  const { t } = useT();
  return (
    <div style={{ paddingTop: 72 }}>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(160deg,#122338 0%,#1E3A5F 60%,#2a4f82 100%)',
        color: 'white', padding: '120px 5% 100px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(2.4rem,5vw,4rem)', fontWeight: 800, margin: 0, lineHeight: 1.05 }}>
            Any<span style={{ color: '#E8700A' }}>Fix</span>
          </h1>
          <p style={{ fontSize: 'clamp(1.1rem,2vw,1.4rem)', fontWeight: 300, opacity: 0.9, marginTop: 24 }}>
            Verified masters for your home — with escrow payment protection.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
            <Link href="/orders/new" style={{
              background: '#E8700A', color: 'white', padding: '16px 32px',
              borderRadius: 50, fontWeight: 600, fontSize: '1rem',
            }}>📝 Post a request</Link>
            <Link href="/masters" style={{
              background: 'transparent', color: 'white', padding: '16px 32px',
              border: '1.5px solid rgba(255,255,255,.4)', borderRadius: 50, fontWeight: 600, fontSize: '1rem',
            }}>🔍 Browse masters</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '80px 5%', background: '#F8F6F2' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', textAlign: 'center', color: '#1E3A5F', marginBottom: 40 }}>
            Categories
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {Object.entries(t.categories).map(([key, label]) => (
              <Link key={key} href={`/masters?category=${key}`} style={{
                background: 'white', borderRadius: 16, padding: '28px 20px',
                textAlign: 'center', boxShadow: '0 2px 12px rgba(30,58,95,.08)',
                fontSize: '1rem', color: '#1E3A5F', fontWeight: 500,
                transition: 'transform .15s, box-shadow .15s',
              }}>{label}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', textAlign: 'center', color: '#1E3A5F', marginBottom: 48 }}>
            How it works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            {[
              { n: 1, title: 'Post a request', body: 'Describe what needs fixing. Verified masters in your area get notified.' },
              { n: 2, title: 'Compare offers', body: 'Receive multiple offers within hours. Pick the master you trust.' },
              { n: 3, title: 'Pay via escrow', body: 'Funds are held safely. Released only after you confirm the work is done.' },
            ].map(s => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%',
                  background: '#E8700A', color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', fontWeight: 700,
                }}>{s.n}</div>
                <h3 style={{ color: '#1E3A5F', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: '#6B7280', lineHeight: 1.6 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
