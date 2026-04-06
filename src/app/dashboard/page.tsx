// AnyFix – src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ordersAPI } from '@/lib/api';
import { useT } from '@/lib/lang';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────
interface Order {
  id: string;
  title: string;
  category: string;
  status: string;
  city: string;
  createdAt: string;
  budget?: number;
  _count: { offers: number };
  payment?: { status: string; amount: number };
}

const STATUS_BG_COLOR: Record<string, { color: string; bg: string; icon: string }> = {
  DRAFT:           { color:'#6B7280', bg:'#F3F4F6', icon:'📝' },
  PUBLISHED:       { color:'#1D4ED8', bg:'#EFF6FF', icon:'📢' },
  OFFERS_RECEIVED: { color:'#92400E', bg:'#FFFBEB', icon:'📬' },
  ACCEPTED:        { color:'#166534', bg:'#F0FDF4', icon:'✅' },
  IN_PROGRESS:     { color:'#9333EA', bg:'#FAF5FF', icon:'🔨' },
  COMPLETED:       { color:'#166534', bg:'#F0FDF4', icon:'🎉' },
  DISPUTED:        { color:'#991B1B', bg:'#FEF2F2', icon:'⚠️' },
  CANCELLED:       { color:'#6B7280', bg:'#F3F4F6', icon:'❌' },
};

const CATEGORY_ICONS: Record<string, string> = {
  ELECTRIC:'⚡', VIK:'🔧', PAINTING:'🎨', MASONRY:'🧱',
  TILES:'🏗️', JOINERY:'🪟', FLOORING:'🪵', HANDYMAN:'🔨',
};

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }: any) {
  return (
    <div style={{
      background:'white', borderRadius:16, padding:'24px',
      boxShadow:'0 2px 12px rgba(30,58,95,.08)',
      border:'1.5px solid #F0F1F3',
      display:'flex', flexDirection:'column', gap:8,
    }}>
      <div style={{ fontSize:28 }}>{icon}</div>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:'1.8rem', fontWeight:800,
        color: accent || '#1E3A5F' }}>{value}</div>
      <div style={{ fontWeight:600, fontSize:'.9rem', color:'#1E3A5F' }}>{label}</div>
      {sub && <div style={{ fontSize:'.78rem', color:'#9AA3AF' }}>{sub}</div>}
    </div>
  );
}

// ─── Order Row ────────────────────────────────────────────
function OrderRow({ order, onAction }: { order: Order; onAction: () => void }) {
  const { t } = useT();
  const meta = STATUS_BG_COLOR[order.status] || STATUS_BG_COLOR.DRAFT;
  const statusLabel = (t.status as any)[order.status] || order.status;
  const router = useRouter();
  return (
    <div onClick={() => router.push(`/orders/${order.id}`)} style={{
      display:'grid', gridTemplateColumns:'auto 1fr auto auto',
      gap:16, alignItems:'center',
      padding:'16px 20px', background:'white',
      borderRadius:12, border:'1.5px solid #F0F1F3',
      cursor:'pointer', transition:'all .2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#1E3A5F')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#F0F1F3')}
    >
      <div style={{ fontSize:24 }}>{CATEGORY_ICONS[order.category] || '🔨'}</div>
      <div>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'.95rem', color:'#1E3A5F', marginBottom:4 }}>
          {order.title}
        </div>
        <div style={{ fontSize:'.78rem', color:'#9AA3AF' }}>
          {order.city} · {new Date(order.createdAt).toLocaleDateString()}
          {order._count.offers > 0 && ` · ${order._count.offers} ${t.clientDash.offers}`}
        </div>
      </div>
      <span style={{
        background: meta.bg, color: meta.color,
        padding:'4px 12px', borderRadius:50,
        fontSize:'.75rem', fontWeight:700, whiteSpace:'nowrap',
      }}>{meta.icon} {statusLabel}</span>
      {order.budget && (
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, color:'#1E3A5F', fontSize:'.95rem' }}>
          €{order.budget.toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ─── New Order Modal ──────────────────────────────────────
function NewOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category:'VIK', title:'', description:'', city: t.newOrder.cities[0],
    urgency:'FLEXIBLE', budget:'',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const inputS: React.CSSProperties = {
    width:'100%', padding:'11px 14px', border:'1.5px solid #E2E5EA',
    borderRadius:10, fontFamily:'Outfit,sans-serif', fontSize:'.9rem',
    outline:'none', boxSizing:'border-box', color:'#1A1A1A',
  };

  const submit = async () => {
    if (!form.title || !form.description) return toast.error(t.newOrder.errorFields);
    if (form.description.length < 30) return toast.error(t.newOrder.errorDesc);
    setLoading(true);
    try {
      await ordersAPI.create({ ...form, budget: form.budget ? Number(form.budget) : undefined });
      toast.success(t.newOrder.success);
      onCreated(); onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t.newOrder.createError);
    } finally { setLoading(false); }
  };

  const categoryKeys = ['ELECTRIC','VIK','PAINTING','MASONRY','TILES','JOINERY','FLOORING','HANDYMAN'] as const;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)',
      zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'white', borderRadius:24, padding:'36px', maxWidth:520,
        width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', color:'#1E3A5F', margin:0 }}>
            {t.newOrder.title}
          </h2>
          <button onClick={onClose} style={{ background:'#F3F4F6', border:'none', width:36, height:36,
            borderRadius:'50%', cursor:'pointer', fontSize:'1.1rem' }}>✕</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 }}>{t.newOrder.category}</label>
            <select value={form.category} onChange={e => set('category',e.target.value)} style={inputS}>
              {categoryKeys.map(v =>
                <option key={v} value={v}>{(t.categories as any)[v]}</option>
              )}
            </select>
          </div>

          <div>
            <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 }}>
              {t.newOrder.titleField} <span style={{ color:'#9AA3AF', fontWeight:400 }}>{t.newOrder.titleHint}</span>
            </label>
            <input value={form.title} onChange={e => set('title',e.target.value)}
              placeholder={t.newOrder.titlePlaceholder} style={inputS} />
          </div>

          <div>
            <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 }}>
              {t.newOrder.description} <span style={{ color:'#9AA3AF', fontWeight:400 }}>{t.newOrder.descHint}</span>
            </label>
            <textarea value={form.description} onChange={e => set('description',e.target.value)}
              placeholder={t.newOrder.descPlaceholder}
              rows={4} style={{ ...inputS, resize:'vertical' }} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 }}>{t.newOrder.city}</label>
              <select value={form.city} onChange={e => set('city',e.target.value)} style={inputS}>
                {t.newOrder.cities.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 }}>{t.newOrder.urgency}</label>
              <select value={form.urgency} onChange={e => set('urgency',e.target.value)} style={inputS}>
                {(['URGENT','WITHIN_3_DAYS','FLEXIBLE'] as const).map(k =>
                  <option key={k} value={k}>{t.urgency[k]}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 }}>
              {t.newOrder.budget} <span style={{ color:'#9AA3AF', fontWeight:400 }}>{t.newOrder.budgetOptional}</span>
            </label>
            <input type="number" value={form.budget} onChange={e => set('budget',e.target.value)}
              placeholder={t.newOrder.budgetPlaceholder} style={inputS} />
          </div>

          <div style={{ background:'#EAF0F8', borderRadius:12, padding:'12px 16px', fontSize:'.82rem', color:'#1E3A5F' }}>
            <strong>{t.newOrder.infoLabel}</strong> {t.newOrder.info}
          </div>

          <button onClick={submit} disabled={loading} style={{
            background: loading ? '#9CA3AF' : '#E8700A',
            color:'white', border:'none', padding:'14px', borderRadius:12,
            fontFamily:'Outfit,sans-serif', fontSize:'1rem', fontWeight:600,
            cursor: loading ? 'default' : 'pointer',
          }}>
            {loading ? t.newOrder.submitting : t.newOrder.submit}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────
export default function ClientDashboard() {
  const { user } = useAuthStore();
  const { t } = useT();
  const router   = useRouter();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [tab,     setTab]     = useState('active');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role === 'MASTER') { router.push('/dashboard/master'); return; }
    if (user.role === 'ADMIN')  { router.push('/admin'); return; }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await ordersAPI.list({ limit: 50 });
      setOrders(data.orders);
    } catch { toast.error(t.clientDash.loadError); }
    finally { setLoading(false); }
  };

  const activeOrders    = orders.filter(o => ['PUBLISHED','OFFERS_RECEIVED','ACCEPTED','IN_PROGRESS'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const totalSpent      = completedOrders.reduce((s,o) => s + (o.payment?.amount || 0), 0);
  const pendingOffers   = orders.filter(o => o.status === 'OFFERS_RECEIVED').length;

  const tabOrders = tab === 'active' ? activeOrders
    : tab === 'completed' ? completedOrders
    : orders.filter(o => o.status === 'DISPUTED');

  if (!user) return null;

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:88 }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', color:'#1E3A5F', margin:0 }}>
              {t.clientDash.welcome} {user.firstName}! 👋
            </h1>
            <p style={{ color:'#9AA3AF', marginTop:6, fontSize:'.9rem' }}>
              {t.clientDash.subtitle}
            </p>
          </div>
          <button onClick={() => setShowNew(true)} style={{
            background:'#E8700A', color:'white', border:'none',
            padding:'13px 28px', borderRadius:50,
            fontFamily:'Outfit,sans-serif', fontSize:'.95rem', fontWeight:600,
            cursor:'pointer', display:'flex', alignItems:'center', gap:8,
          }}>
            {t.clientDash.newOrder}
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:32 }}>
          <StatCard icon="📋" label={t.clientDash.stats.active}    value={activeOrders.length}    sub={t.clientDash.stats.activesSub} />
          <StatCard icon="📬" label={t.clientDash.stats.pending}   value={pendingOffers}          sub={t.clientDash.stats.pendingSub} accent="#E8700A" />
          <StatCard icon="✅" label={t.clientDash.stats.completed} value={completedOrders.length} sub={t.clientDash.stats.completedSub} />
          <StatCard icon="💰" label={t.clientDash.stats.spent}     value={`€${totalSpent.toLocaleString()}`} sub={t.clientDash.stats.spentSub} />
        </div>

        {/* ── Alert: pending offers ── */}
        {pendingOffers > 0 && (
          <div style={{
            background:'#FFFBEB', border:'1.5px solid #FCD34D',
            borderRadius:12, padding:'16px 20px', marginBottom:24,
            display:'flex', alignItems:'center', gap:12,
          }}>
            <span style={{ fontSize:24 }}>📬</span>
            <div>
              <strong style={{ color:'#92400E' }}>{t.clientDash.alert.title} {pendingOffers} {t.clientDash.alert.orders}</strong>
              <p style={{ color:'#92400E', fontSize:'.85rem', margin:'2px 0 0' }}>
                {t.clientDash.alert.sub}
              </p>
            </div>
            <button onClick={() => setTab('active')} style={{
              marginLeft:'auto', background:'#F59E0B', color:'white',
              border:'none', padding:'8px 18px', borderRadius:50, cursor:'pointer', fontWeight:600, fontSize:'.85rem',
            }}>{t.clientDash.alert.btn}</button>
          </div>
        )}

        {/* ── Tabs + Orders ── */}
        <div style={{ background:'white', borderRadius:20, boxShadow:'0 2px 12px rgba(30,58,95,.08)' }}>
          <div style={{ display:'flex', borderBottom:'1.5px solid #F0F1F3', padding:'0 20px' }}>
            {[
              ['active',    `${t.clientDash.tabs.active} (${activeOrders.length})`],
              ['completed', `${t.clientDash.tabs.completed} (${completedOrders.length})`],
              ['disputes',  t.clientDash.tabs.disputes],
            ].map(([key,label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding:'16px 20px', border:'none', background:'transparent', cursor:'pointer',
                fontFamily:'Outfit,sans-serif', fontSize:'.9rem', fontWeight: tab===key ? 600 : 400,
                color: tab===key ? '#1E3A5F' : '#9AA3AF',
                borderBottom: tab===key ? '2.5px solid #E8700A' : '2.5px solid transparent',
                marginBottom:'-1.5px',
              }}>{label}</button>
            ))}
          </div>

          <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:10 }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:'40px', color:'#9AA3AF' }}>{t.common.loading}</div>
            ) : tabOrders.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>📭</div>
                <p style={{ color:'#9AA3AF', fontWeight:500 }}>{t.clientDash.empty}</p>
                {tab === 'active' && (
                  <button onClick={() => setShowNew(true)} style={{
                    marginTop:16, background:'#E8700A', color:'white',
                    border:'none', padding:'12px 24px', borderRadius:50, cursor:'pointer', fontWeight:600,
                  }}>{t.clientDash.createFirst}</button>
                )}
              </div>
            ) : tabOrders.map(o => <OrderRow key={o.id} order={o} onAction={loadOrders} />)}
          </div>
        </div>
      </div>

      {showNew && <NewOrderModal onClose={() => setShowNew(false)} onCreated={loadOrders} />}
    </div>
  );
}
