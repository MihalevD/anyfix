// AnyFix – src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [stats,   setStats]   = useState<any>(null);
  const [masters, setMasters] = useState<any[]>([]);
  const [disputes,setDisputes]= useState<any[]>([]);
  const [frauds,  setFrauds]  = useState<any[]>([]);
  const [tab,     setTab]     = useState<'overview'|'verify'|'disputes'|'fraud'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    loadAll();
  }, [user]);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, m, d, f] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getMasters({ status:'DOCUMENTS_SUBMITTED', limit:20 }),
        adminAPI.getDisputes({ status:'OPEN', limit:20 }),
        adminAPI.getFraudLogs(),
      ]);
      setStats(s.data);
      setMasters(m.data.masters);
      setDisputes(d.data.disputes);
      setFrauds(f.data);
    } catch { toast.error('Грешка при зареждане'); }
    finally { setLoading(false); }
  }

  async function verifyMaster(id: string, action: string) {
    try {
      await adminAPI.updateMaster(id, { action });
      toast.success(`Майсторът е ${action === 'APPROVE' ? 'одобрен' : 'отказан'}`);
      loadAll();
    } catch { toast.error('Грешка'); }
  }

  async function resolveDispute(id: string, action: string) {
    const resolution = prompt('Въведи решение:');
    if (!resolution) return;
    try {
      await adminAPI.resolveDispute(id, { action, resolution });
      toast.success('Спорът е разрешен');
      loadAll();
    } catch { toast.error('Грешка'); }
  }

  if (!user || loading) return <Loading />;

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:80 }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 20px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', color:'#1E3A5F', margin:0 }}>Admin Панел</h1>
            <p style={{ color:'#6B7280', fontSize:'.85rem', margin:'4px 0 0' }}>AnyFix вътрешна администрация</p>
          </div>
          <button onClick={loadAll} style={{ background:'white', border:'1.5px solid #E2E5EA', color:'#6B7280', padding:'9px 20px', borderRadius:50, cursor:'pointer', fontSize:'.85rem', fontWeight:500 }}>
            🔄 Обнови
          </button>
        </div>

        {/* Stats grid */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
            {[
              { label:'Потребители', value:stats.totalUsers, icon:'👥', color:'#1E3A5F' },
              { label:'Верифицирани майстори', value:stats.totalMasters, icon:'✅', color:'#166534' },
              { label:'Revenue (€)', value:`€${stats.totalRevenue?.toFixed(0)}`, icon:'💰', color:'#E8700A' },
              { label:'Отворени спорове', value:stats.openDisputes, icon:'⚠️', color: stats.openDisputes > 0 ? '#DC2626' : '#6B7280' },
            ].map(s => (
              <div key={s.label} style={{ background:'white', borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 8px rgba(30,58,95,.07)' }}>
                <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.7rem', color:s.color, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:'.75rem', color:'#6B7280', marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Alert badges */}
        {stats && (
          <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
            {stats.pendingVerification > 0 && (
              <div style={{ background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:10, padding:'10px 16px', fontSize:'.85rem', color:'#92400E', fontWeight:500 }}>
                🔔 {stats.pendingVerification} майстора чакат верификация
              </div>
            )}
            {stats.flaggedMessages > 0 && (
              <div style={{ background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:10, padding:'10px 16px', fontSize:'.85rem', color:'#DC2626', fontWeight:500 }}>
                ⚠️ {stats.flaggedMessages} флагнати съобщения (Anti-Fraud)
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:24, background:'white', padding:6, borderRadius:14, width:'fit-content', boxShadow:'0 2px 6px rgba(30,58,95,.06)' }}>
          {[
            { key:'overview', label:'📊 Обзор' },
            { key:'verify',   label:`🔍 Верификации ${masters.length > 0 ? `(${masters.length})` : ''}` },
            { key:'disputes', label:`⚖️ Спорове ${disputes.length > 0 ? `(${disputes.length})` : ''}` },
            { key:'fraud',    label:`🛡️ Anti-Fraud ${frauds.length > 0 ? `(${frauds.length})` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              padding:'8px 20px', borderRadius:10, border:'none',
              background: tab===t.key ? '#1E3A5F' : 'transparent',
              color: tab===t.key ? 'white' : '#6B7280',
              fontFamily:'Outfit,sans-serif', fontSize:'.85rem', fontWeight:600, cursor:'pointer',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && stats && (
          <div style={{ background:'white', borderRadius:18, padding:'28px' }}>
            <h2 style={sectionTitle}>Активни поръчки по статус</h2>
            <p style={{ color:'#6B7280', fontSize:'.9rem' }}>Активни: <strong>{stats.activeOrders}</strong> · Общо: <strong>{stats.totalOrders}</strong></p>
          </div>
        )}

        {tab === 'verify' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {masters.length === 0 ? (
              <EmptyCard icon="✅" msg="Няма чакащи верификации" />
            ) : masters.map((m: any) => (
              <div key={m.id} style={{ background:'white', borderRadius:16, padding:'22px 26px', boxShadow:'0 2px 6px rgba(30,58,95,.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div>
                    <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1E3A5F', margin:0, fontSize:'1rem' }}>
                      {m.user.firstName} {m.user.lastName}
                    </h3>
                    <p style={{ color:'#6B7280', fontSize:'.8rem', margin:'3px 0 0' }}>{m.user.email} · {m.user.phone}</p>
                    <p style={{ color:'#6B7280', fontSize:'.8rem', margin:'2px 0 0' }}>
                      Категории: {m.categories?.map((c: any) => c.category).join(', ') || '–'}
                    </p>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => verifyMaster(m.id, 'APPROVE')} style={{ background:'#166534', color:'white', border:'none', padding:'9px 18px', borderRadius:50, fontSize:'.82rem', fontWeight:600, cursor:'pointer' }}>
                      ✓ Одобри
                    </button>
                    <button onClick={() => verifyMaster(m.id, 'SCHEDULE_INTERVIEW')} style={{ background:'#7C3AED', color:'white', border:'none', padding:'9px 18px', borderRadius:50, fontSize:'.82rem', fontWeight:600, cursor:'pointer' }}>
                      📅 Интервю
                    </button>
                    <button onClick={() => verifyMaster(m.id, 'REJECT')} style={{ background:'#DC2626', color:'white', border:'none', padding:'9px 18px', borderRadius:50, fontSize:'.82rem', fontWeight:600, cursor:'pointer' }}>
                      ✕ Откажи
                    </button>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {m.documents?.map((d: any) => (
                    <a key={d.id} href={`/api/admin/documents/${d.id}`} target="_blank" style={{
                      background: d.status==='APPROVED' ? '#F0FDF4' : '#F3F4F6',
                      color: d.status==='APPROVED' ? '#166534' : '#6B7280',
                      padding:'5px 12px', borderRadius:50, fontSize:'.72rem', fontWeight:600, textDecoration:'none', cursor:'pointer',
                    }}>
                      {d.type} {d.status==='APPROVED' ? '✅' : '⏳'}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'disputes' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {disputes.length === 0 ? (
              <EmptyCard icon="⚖️" msg="Няма отворени спорове" />
            ) : disputes.map((d: any) => (
              <div key={d.id} style={{ background:'white', borderRadius:16, padding:'22px 26px', boxShadow:'0 2px 6px rgba(30,58,95,.06)', border:'1.5px solid #FECACA' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1E3A5F', margin:0, fontSize:'.95rem' }}>
                      Поръчка #{d.orderId.slice(0,8)} · {d.order?.category}
                    </h3>
                    <p style={{ color:'#6B7280', fontSize:'.8rem', margin:'3px 0 0' }}>
                      Клиент: {d.order?.client?.firstName} {d.order?.client?.lastName} · {new Date(d.createdAt).toLocaleDateString('bg-BG')}
                    </p>
                    {d.order?.payment?.amount && (
                      <p style={{ color:'#E8700A', fontSize:'.82rem', margin:'2px 0 0', fontWeight:600 }}>
                        💰 Amount: €{d.order.payment.amount.toFixed(0)}
                      </p>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => resolveDispute(d.id, 'RESOLVE_CLIENT')} style={{ background:'#166534', color:'white', border:'none', padding:'8px 16px', borderRadius:50, fontSize:'.78rem', fontWeight:600, cursor:'pointer' }}>
                      Върни на клиент
                    </button>
                    <button onClick={() => resolveDispute(d.id, 'RESOLVE_MASTER')} style={{ background:'#1E3A5F', color:'white', border:'none', padding:'8px 16px', borderRadius:50, fontSize:'.78rem', fontWeight:600, cursor:'pointer' }}>
                      Освободи на майстор
                    </button>
                  </div>
                </div>
                <div style={{ background:'#FEF2F2', borderRadius:10, padding:'10px 14px' }}>
                  <p style={{ color:'#991B1B', fontSize:'.82rem', margin:0, lineHeight:1.6 }}>
                    <strong>Причина:</strong> {d.reason}
                  </p>
                  <p style={{ color:'#991B1B', fontSize:'.82rem', margin:'4px 0 0' }}>{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'fraud' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {frauds.length === 0 ? (
              <EmptyCard icon="🛡️" msg="Няма регистрирани измами" />
            ) : frauds.map((f: any) => (
              <div key={f.id} style={{ background:'white', borderRadius:14, padding:'18px 22px', boxShadow:'0 2px 6px rgba(30,58,95,.05)', border:'1.5px solid #FECACA' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div>
                    <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#991B1B', fontSize:'.9rem' }}>
                      {f.action === 'HONEYPOT_DEPLOYED' ? '🍯 Honeypot' : '⚠️ Fraud засечен'}
                    </span>
                    <span style={{ fontSize:'.75rem', color:'#6B7280', marginLeft:12 }}>{new Date(f.createdAt).toLocaleString('bg-BG')}</span>
                  </div>
                  {f.metadata?.score && (
                    <span style={{ background:'#FEF2F2', color:'#DC2626', padding:'4px 12px', borderRadius:50, fontSize:'.75rem', fontWeight:700 }}>
                      Риск: {f.metadata.score}/15
                    </span>
                  )}
                </div>
                {f.user && (
                  <p style={{ fontSize:'.82rem', color:'#6B7280', margin:'0 0 6px' }}>
                    Потребител: <strong>{f.user.firstName} {f.user.lastName}</strong> ({f.user.role})
                  </p>
                )}
                {f.metadata?.reasons && (
                  <p style={{ fontSize:'.8rem', color:'#4B5563', margin:0 }}>Засечено: {f.metadata.reasons}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCard({ icon, msg }: { icon:string; msg:string }) {
  return (
    <div style={{ background:'white', borderRadius:16, padding:48, textAlign:'center', color:'#9CA3AF', boxShadow:'0 2px 6px rgba(30,58,95,.05)' }}>
      <div style={{ fontSize:40, marginBottom:8 }}>{icon}</div>
      <p style={{ margin:0, fontSize:'.9rem' }}>{msg}</p>
    </div>
  );
}

function Loading() {
  return <div style={{ minHeight:'100vh', paddingTop:100, display:'flex', alignItems:'center', justifyContent:'center', color:'#6B7280' }}>Зареждане...</div>;
}

const sectionTitle: React.CSSProperties = { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1.05rem', color:'#1E3A5F', margin:'0 0 12px' };
