// AnyFix – src/app/dashboard/master/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ordersAPI, mastersAPI } from '@/lib/api';
import { useT } from '@/lib/lang';
import toast from 'react-hot-toast';

const VERIFY_STEP_KEYS = ['PENDING','DOCUMENTS_SUBMITTED','UNDER_REVIEW','INTERVIEW_SCHEDULED','APPROVED'];

const LEVEL_INFO: Record<string, { label: string; color: string; next?: string }> = {
  STAJANT:     { label:'Стажант',      color:'#6B7280', next:'10 orders + 4.0★' },
  MAJSTOR:     { label:'Майстор',      color:'#1D4ED8', next:'30 orders + 4.3★' },
  PRO_MAJSTOR: { label:'Про Майстор',  color:'#7C3AED', next:'75 orders + 4.6★' },
  ELIT:        { label:'Елит',         color:'#D97706', next:'150 orders + 4.8★' },
  CERTIFIED:   { label:'AnyFix Certified', color:'#166534', next: undefined },
};

function EarningsChart({ data }: { data: { label: string; amount: number }[] }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:80 }}>
      {data.map(d => (
        <div key={d.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{
            width:'100%', background:'#1E3A5F', borderRadius:'4px 4px 0 0',
            height: `${(d.amount/max)*72}px`, minHeight: d.amount > 0 ? 4 : 2,
            opacity: d.amount > 0 ? 1 : .2,
          }} />
          <span style={{ fontSize:'.65rem', color:'rgba(255,255,255,.5)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function OfferModal({ order, onClose, onSent }: { order: any; onClose: () => void; onSent: () => void }) {
  const { t } = useT();
  const m = t.masterDash.offerModal;
  const [form, setForm] = useState({ price:'', description:'', estimatedHours:'' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.price || !form.description) return toast.error(m.fillFields);
    setLoading(true);
    try {
      await ordersAPI.addOffer(order.id, {
        price: Number(form.price),
        description: form.description,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      });
      toast.success(m.sent);
      onSent(); onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || m.error);
    } finally { setLoading(false); }
  };

  const iS: React.CSSProperties = {
    width:'100%', padding:'11px 14px', border:'1.5px solid #E2E5EA',
    borderRadius:10, fontFamily:'Outfit,sans-serif', fontSize:'.9rem',
    outline:'none', boxSizing:'border-box', color:'#1A1A1A',
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:200,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'white', borderRadius:24, padding:'36px', maxWidth:480, width:'100%' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, color:'#1E3A5F', margin:0, fontSize:'1.2rem' }}>
            {m.title}
          </h2>
          <button onClick={onClose} style={{ background:'#F3F4F6', border:'none', width:36, height:36, borderRadius:'50%', cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ background:'#EAF0F8', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <div style={{ fontWeight:700, color:'#1E3A5F', fontSize:'.9rem' }}>{order.title}</div>
          <div style={{ fontSize:'.78rem', color:'#6B7280', marginTop:4 }}>{order.city} · {order.category}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 }}>{m.priceLabel}</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({...f, price:e.target.value}))}
                placeholder={m.pricePlaceholder} style={iS} />
            </div>
            <div>
              <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 }}>{m.hoursLabel}</label>
              <input type="number" value={form.estimatedHours} onChange={e => setForm(f => ({...f, estimatedHours:e.target.value}))}
                placeholder={m.hoursPlaceholder} style={iS} />
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 }}>{m.descLabel}</label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))}
              placeholder={m.descPlaceholder}
              rows={4} style={{ ...iS, resize:'vertical' }} />
          </div>
          {form.price && (
            <div style={{ background:'#F0FDF4', borderRadius:10, padding:'12px 14px', fontSize:'.82rem', color:'#166534' }}>
              <strong>{m.yourEarnings}</strong> ~€{Math.round(Number(form.price) * 0.86).toLocaleString()}
              <span style={{ color:'#6B7280', marginLeft:6 }}>{m.afterFee}</span>
            </div>
          )}
          <button onClick={submit} disabled={loading} style={{
            background: loading ? '#9CA3AF' : '#1E3A5F',
            color:'white', border:'none', padding:'14px', borderRadius:12,
            fontFamily:'Outfit,sans-serif', fontSize:'1rem', fontWeight:600, cursor: loading ? 'default' : 'pointer',
          }}>
            {loading ? m.submitting : m.submit}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MasterDashboard() {
  const { user }   = useAuthStore();
  const { t } = useT();
  const md = t.masterDash;
  const router     = useRouter();
  const [profile,  setProfile]  = useState<any>(null);
  const [orders,   setOrders]   = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('available');
  const [offerFor, setOfferFor] = useState<any>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'MASTER') { router.push('/dashboard'); return; }
    init();
  }, [user]);

  const init = async () => {
    setLoading(true);
    try {
      const [profileRes, availRes, myRes] = await Promise.all([
        mastersAPI.get('me' as any),
        ordersAPI.list({ status:'PUBLISHED', limit:30 }),
        ordersAPI.list({ limit:30 }),
      ]);
      setProfile(profileRes.data);
      setOrders(availRes.data.orders);
      setMyOrders(myRes.data.orders);
    } catch { toast.error(md.loadError); }
    finally { setLoading(false); }
  };

  const master = user?.masterProfile;
  const levelInfo = LEVEL_INFO[master?.level || 'STAJANT'];
  const verifyIndex = VERIFY_STEP_KEYS.findIndex(s => s === master?.verificationStatus) ?? 0;

  const weeklyLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const weeklyData = [
    { label: weeklyLabels[0], amount:320 }, { label: weeklyLabels[1], amount:0 },
    { label: weeklyLabels[2], amount:580 }, { label: weeklyLabels[3], amount:200 },
    { label: weeklyLabels[4], amount:950 }, { label: weeklyLabels[5], amount:420 }, { label: weeklyLabels[6], amount:0 },
  ];

  if (!user) return null;

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:88 }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 20px' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', color:'#1E3A5F', margin:0 }}>
              {md.hello} {user.firstName}! {md.emoji}
            </h1>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
              <span style={{
                background: '#EAF0F8', color: levelInfo.color,
                padding:'4px 14px', borderRadius:50, fontSize:'.8rem', fontWeight:700,
              }}>⭐ {levelInfo.label}</span>
              <span style={{ color:'#9AA3AF', fontSize:'.82rem' }}>
                {master?.averageRating?.toFixed(1)}★ · {master?.completedOrders} {md.completedOrders}
              </span>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => router.push('/profile/master')} style={{
              background:'white', border:'1.5px solid #E2E5EA', color:'#1E3A5F',
              padding:'10px 20px', borderRadius:50, cursor:'pointer', fontWeight:600, fontSize:'.88rem',
            }}>{md.profileBtn}</button>
            {!profile?.stripeAccountId && (
              <button onClick={() => mastersAPI.stripeOnboard().then(r => window.location.href = r.data.onboardingUrl)} style={{
                background:'#1E3A5F', color:'white', border:'none',
                padding:'10px 20px', borderRadius:50, cursor:'pointer', fontWeight:600, fontSize:'.88rem',
              }}>{md.stripeBtn}</button>
            )}
          </div>
        </div>

        {/* ── Verification banner ── */}
        {master?.verificationStatus !== 'APPROVED' && (
          <div style={{ background:'white', borderRadius:16, padding:'20px 24px', marginBottom:24,
            border:'1.5px solid #FCD34D', boxShadow:'0 2px 12px rgba(30,58,95,.06)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
              <div>
                <strong style={{ color:'#1E3A5F', fontFamily:'Syne,sans-serif' }}>{md.verifyTitle}</strong>
                <p style={{ color:'#9AA3AF', fontSize:'.82rem', margin:'4px 0 0' }}>{md.verifySub}</p>
              </div>
              <button onClick={() => router.push('/verify')} style={{
                background:'#E8700A', color:'white', border:'none',
                padding:'10px 20px', borderRadius:50, cursor:'pointer', fontWeight:600, fontSize:'.85rem',
              }}>{md.verifyContinue}</button>
            </div>
            <div style={{ display:'flex', gap:0, position:'relative' }}>
              <div style={{ position:'absolute', top:14, left:'10%', right:'10%', height:2,
                background:'#E2E5EA', zIndex:0 }} />
              {VERIFY_STEP_KEYS.map((key, i) => {
                const done = i <= verifyIndex;
                return (
                  <div key={key} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8, zIndex:1 }}>
                    <div style={{
                      width:28, height:28, borderRadius:'50%',
                      background: done ? '#1E3A5F' : 'white',
                      border: done ? 'none' : '2px solid #E2E5EA',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'white', fontSize:'.8rem', fontWeight:700,
                    }}>{done ? '✓' : i+1}</div>
                    <span style={{ fontSize:'.72rem', color: done ? '#1E3A5F' : '#9AA3AF',
                      fontWeight: done ? 700 : 400, textAlign:'center' }}>{md.verifySteps[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24 }}>
          {/* ── Main: Orders ── */}
          <div>
            <div style={{ background:'white', borderRadius:20, boxShadow:'0 2px 12px rgba(30,58,95,.08)' }}>
              <div style={{ display:'flex', borderBottom:'1.5px solid #F0F1F3', padding:'0 20px' }}>
                {[['available', md.tabs.available],['mine', md.tabs.mine]].map(([key,label]) => (
                  <button key={key} onClick={() => setTab(key)} style={{
                    padding:'16px 20px', border:'none', background:'transparent', cursor:'pointer',
                    fontFamily:'Outfit,sans-serif', fontSize:'.9rem',
                    fontWeight: tab===key ? 600 : 400,
                    color: tab===key ? '#1E3A5F' : '#9AA3AF',
                    borderBottom: tab===key ? '2.5px solid #E8700A' : '2.5px solid transparent',
                    marginBottom:'-1.5px',
                  }}>{label}</button>
                ))}
              </div>
              <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
                {loading ? (
                  <div style={{ textAlign:'center', padding:'40px', color:'#9AA3AF' }}>{t.common.loading}</div>
                ) : (tab === 'available' ? orders : myOrders).length === 0 ? (
                  <div style={{ textAlign:'center', padding:'60px 20px', color:'#9AA3AF' }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                    <p>{tab === 'available' ? md.noAvailable : md.noMine}</p>
                  </div>
                ) : (tab === 'available' ? orders : myOrders).map((order: any) => (
                  <div key={order.id} style={{
                    background:'#F9FAFB', borderRadius:12, padding:'16px',
                    border:'1.5px solid #F0F1F3', cursor:'pointer',
                    transition:'all .2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#1E3A5F')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#F0F1F3')}
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1E3A5F', marginBottom:4 }}>
                          {order.title}
                        </div>
                        <div style={{ fontSize:'.78rem', color:'#9AA3AF' }}>
                          {order.city} · {(md.urgency as any)[order.urgency] || order.urgency}
                          {order.budget && ` · ${md.upTo} €${order.budget.toLocaleString()}`}
                        </div>
                      </div>
                      {tab === 'available' && master?.verificationStatus === 'APPROVED' && (
                        <button onClick={e => { e.stopPropagation(); setOfferFor(order); }} style={{
                          background:'#E8700A', color:'white', border:'none',
                          padding:'8px 18px', borderRadius:50, cursor:'pointer',
                          fontWeight:600, fontSize:'.82rem', whiteSpace:'nowrap',
                        }}>{md.offerBtn}</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar: Stats ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Earnings */}
            <div style={{ background:'#1E3A5F', borderRadius:20, padding:'24px', color:'white' }}>
              <div style={{ fontSize:'.8rem', color:'rgba(255,255,255,.5)', marginBottom:4, textTransform:'uppercase', letterSpacing:'.06em' }}>
                {md.thisWeek}
              </div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:'2rem', fontWeight:800, marginBottom:4 }}>
                €{weeklyData.reduce((s,d) => s+d.amount, 0).toLocaleString()}
              </div>
              <EarningsChart data={weeklyData} />
            </div>

            {/* Quick stats */}
            {[
              { icon:'📋', label: md.stats.active,   value: myOrders.filter(o => o.status === 'IN_PROGRESS').length },
              { icon:'⏱️', label: md.stats.response, value: `${master?.responseTimeHours || 4}h` },
              { icon:'⭐', label: md.stats.rating,   value: `${master?.averageRating?.toFixed(1) || '–'} / 5` },
            ].map(s => (
              <div key={s.label} style={{ background:'white', borderRadius:16, padding:'20px',
                boxShadow:'0 2px 8px rgba(30,58,95,.06)', display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ fontSize:28 }}>{s.icon}</span>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', color:'#1E3A5F' }}>{s.value}</div>
                  <div style={{ fontSize:'.78rem', color:'#9AA3AF' }}>{s.label}</div>
                </div>
              </div>
            ))}

            {/* Next level */}
            {levelInfo.next && (
              <div style={{ background:'#FEF3E8', borderRadius:16, padding:'20px', border:'1.5px solid #FDBA74' }}>
                <div style={{ fontWeight:700, color:'#92400E', fontSize:'.88rem', marginBottom:8 }}>
                  {md.nextLevel}
                </div>
                <div style={{ fontSize:'.82rem', color:'#92400E' }}>{levelInfo.next}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {offerFor && <OfferModal order={offerFor} onClose={() => setOfferFor(null)} onSent={init} />}
    </div>
  );
}
