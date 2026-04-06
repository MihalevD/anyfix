// AnyFix – src/components/layout/MainLayout.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { LangProvider, useT } from '@/lib/lang';
import toast, { Toaster } from 'react-hot-toast';

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { user, fetchMe, logout } = useAuthStore();
  const { t, lang, setLang } = useT();
  const pathname = usePathname();
  const router   = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) fetchMe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Outfit', sans-serif" }}>
      <Toaster position="bottom-center" />

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 5%',
        background: scrolled ? 'rgba(255,255,255,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 1px 16px rgba(30,58,95,.10)' : 'none',
        transition: 'all .3s ease',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:72, maxWidth:1200, margin:'0 auto' }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
            <div style={{ width:38, height:38, background:'#E8700A', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'white', fontSize:20 }}>🏠</span>
            </div>
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.5rem', color:'#1E3A5F', letterSpacing:'-.02em' }}>
              Any<span style={{ color:'#E8700A' }}>Fix</span>
            </span>
          </Link>

          <div style={{ display:'flex', alignItems:'center', gap:24 }}>
            {(['/', '/masters', '/how-it-works'] as const).map(href => (
              <Link key={href} href={href} style={{
                fontSize:'.9rem', fontWeight:500, color: pathname===href ? '#1E3A5F' : '#6B7280',
                textDecoration:'none', transition:'color .2s',
              }}>
                { href==='/' ? t.nav.home : href==='/masters' ? t.nav.masters : t.nav.howItWorks }
              </Link>
            ))}

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'bg' ? 'en' : 'bg')}
              style={{
                background: 'transparent', border: '1.5px solid #E2E5EA',
                color: '#6B7280', padding: '6px 14px', borderRadius: 50,
                cursor: 'pointer', fontSize: '.82rem', fontWeight: 600,
                transition: 'all .2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1E3A5F'; (e.currentTarget as HTMLButtonElement).style.color = '#1E3A5F'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E5EA'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; }}
              title={lang === 'bg' ? 'Switch to English' : 'Превключи на Български'}
            >
              {lang === 'bg' ? '🇬🇧 EN' : '🇧🇬 BG'}
            </button>

            {user ? (
              <>
                <Link href="/dashboard" style={{
                  fontSize:'.9rem', fontWeight:500, color:'#6B7280', textDecoration:'none',
                }}>
                  {user.firstName} {user.lastName}
                </Link>
                <button onClick={logout} style={{
                  background:'transparent', border:'1.5px solid #E2E5EA', color:'#6B7280',
                  padding:'9px 20px', borderRadius:50, cursor:'pointer', fontSize:'.85rem', fontWeight:500,
                }}>{t.nav.logout}</button>
              </>
            ) : (
              <>
                <Link href="/login" style={{ fontSize:'.9rem', fontWeight:500, color:'#6B7280', textDecoration:'none' }}>
                  {t.nav.login}
                </Link>
                <Link href="/register" style={{
                  background:'#1E3A5F', color:'white', padding:'10px 24px',
                  borderRadius:50, textDecoration:'none', fontSize:'.9rem', fontWeight:600,
                  transition:'background .2s',
                }}>
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>{children}</main>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#122338', color:'rgba(255,255,255,.5)', padding:'60px 5% 40px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:40, marginBottom:48 }}>
            <div>
              <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.5rem', color:'white' }}>
                Any<span style={{ color:'#E8700A' }}>Fix</span>
              </span>
              <p style={{ fontSize:'.9rem', lineHeight:1.7, maxWidth:280, marginTop:12, fontWeight:300 }}>
                {t.footer.description}
              </p>
            </div>
            {[
              { title: t.footer.services, links: t.footer.links.services },
              { title: t.footer.forMasters, links: t.footer.links.forMasters },
              { title: t.footer.company, links: t.footer.links.company },
            ].map(col => (
              <div key={col.title}>
                <h5 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'.9rem', color:'white', marginBottom:16 }}>{col.title}</h5>
                <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
                  {(col.links as [string, string][]).map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} style={{ fontSize:'.85rem', color:'rgba(255,255,255,.45)', textDecoration:'none' }}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ paddingTop:24, borderTop:'1px solid rgba(255,255,255,.08)', display:'flex', justifyContent:'space-between', fontSize:'.8rem', flexWrap:'wrap', gap:8 }}>
            <span>{t.footer.copyright}</span>
            <div style={{ display:'flex', gap:20 }}>
              {([[t.footer.terms,'/terms'],[t.footer.privacy,'/privacy'],[t.footer.cookies,'/cookies']] as [string,string][]).map(([l,h]) => (
                <Link key={h} href={h} style={{ color:'rgba(255,255,255,.4)', textDecoration:'none' }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <LayoutInner>{children}</LayoutInner>
    </LangProvider>
  );
}
