// AnyFix – src/pages/dashboard/client.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ordersAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:           { label:'Чернова',       color:'#6B7280', bg:'#F3F4F6' },
  PUBLISHED:       { label:'Публикувана',   color:'#1E3A5F', bg:'#EAF0F8' },
  OFFERS_RECEIVED: { label:'Има оферти',    color:'#92400E', bg:'#FFFBEB' },
  ACCEPTED:        { label:'Приета',        color:'#065F46', bg:'#ECFDF5' },
  IN_PROGRESS:     { label:'В изпълнение',  color:'#1D4ED8', bg:'#EFF6FF' },
  COMPLETED:       { label:'Завършена',     color:'#166534', bg:'#F0FDF4' },
  DISPUTED:        { label:'Спор',          color:'#991B1B', bg:'#FEF2F2' },
  CANCELLED:       { label:'Отменена',      color:'#6B7280', bg:'#F3F4F6' },
};

const CAT_ICONS: Record<string, string> = {
  ELECTRIC:'⚡', VIK:'🔧', PAINTING:'🎨', MASONRY:'🧱',
  TILES:'🏗️', JOINERY:'🪟', FLOORING:'🪵', HANDYMAN:'🔨', HVAC:'❄️', INSULATION:'🏠',
};

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('ALL');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'CLIENT') { router.push('/dashboard/master'); return; }
    fetchOrders();
  }, [user]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const { data } = await ordersAPI.list(params);
      setOrders(data.orders);
    } catch { toast.error('Грешка при зареждане'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (user) fetchOrders(); }, [filter]);

  const stats = {
    total:      orders.length,
    active:     orders.filter(o => ['PUBLISHED','OFFERS_RECEIVED','ACCEPTED','IN_PROGRESS'].includes(o.status)).length,
    completed:  orders.filter(o => o.status === 'COMPLETED').length,
    totalSpent: orders.filter(o => o.payment?.status === 'RELEASED')
                      .reduce((s: number, o: any) => s + (o.payment?.amount || 0), 0),
  };

  if (!user) return null;

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:80 }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32, flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', color:'#1E3A5F', margin:0 }}>
              Здравей, {user.firstName}! 👋
            </h1>
            <p style={{ color:'#6B7280', margin:'4px 0 0', fontSize:'.9rem' }}>Управлявай своите поръчки за ремонт</p>
          </div>
          <Link href="/orders/new" style={{
            background:'#E8700A', color:'white', padding:'12px 28px',
            borderRadius:50, textDecoration:'none', fontWeight:600, fontSize:'.95rem',
            display:'flex', alignItems:'center', gap:8, transition:'all .2s',
          }}>
            + Нова поръчка
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:32 }}>
          {[
            { label:'Общо поръчки',  value: stats.total,     icon:'📋' },
            { label:'Активни',       value: stats.active,    icon:'⚡', accent:true },
            { label:'Завършени',     value: stats.completed, icon:'✅' },
            { label:'Total Spent',    value: `€${stats.totalSpent.toFixed(0)}`, icon:'💰' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.accent ? '#1E3A5F' : 'white',
              borderRadius:16, padding:'20px 24px',
              boxShadow:'0 2px 8px rgba(30,58,95,.08)',
            }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', color: s.accent ? 'white' : '#1E3A5F', lineHeight:1 }}>
                {s.value}
              </div>
              <div style={{ fontSize:'.78rem', color: s.accent ? 'rgba(255,255,255,.7)' : '#6B7280', marginTop:4, fontWeight:400 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
          {['ALL','PUBLISHED','OFFERS_RECEIVED','IN_PROGRESS','COMPLETED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'8px 18px', borderRadius:50, border:'1.5px solid',
              borderColor: filter===f ? '#1E3A5F' : '#E2E5EA',
              background: filter===f ? '#1E3A5F' : 'white',
              color: filter===f ? 'white' : '#6B7280',
              fontFamily:'Outfit,sans-serif', fontSize:'.82rem', fontWeight:600,
              cursor:'pointer', transition:'all .2s',
            }}>
              {f==='ALL' ? 'Всички' : (STATUS_LABELS[f]?.label || f)}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#6B7280' }}>Зареждане...</div>
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {orders.map(order => <OrderCard key={order.id} order={order} onRefresh={fetchOrders} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, onRefresh }: { order: any; onRefresh: () => void }) {
  const s = STATUS_LABELS[order.status] || { label: order.status, color:'#6B7280', bg:'#F3F4F6' };
  const router = useRouter();

  async function handleComplete() {
    if (!confirm('Потвърждаваш ли, че работата е завършена? Плащането ще бъде освободено.')) return;
    try {
      await ordersAPI.complete(order.id);
      toast.success('Поръчката е завършена! Плащането е освободено.');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Грешка');
    }
  }

  return (
    <div style={{
      background:'white', borderRadius:16, padding:'24px 28px',
      boxShadow:'0 2px 8px rgba(30,58,95,.07)',
      border:'1.5px solid #F0F1F3',
      cursor:'pointer', transition:'all .2s',
    }}
    onClick={() => router.push(`/orders/${order.id}`)}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:28 }}>{CAT_ICONS[order.category] || '🔨'}</span>
          <div>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1rem', color:'#1E3A5F', margin:0, marginBottom:3 }}>
              {order.title}
            </h3>
            <span style={{ fontSize:'.78rem', color:'#6B7280' }}>
              📍 {order.city} · {new Date(order.createdAt).toLocaleDateString('bg-BG')}
            </span>
          </div>
        </div>
        <span style={{ background:s.bg, color:s.color, padding:'5px 14px', borderRadius:50, fontSize:'.75rem', fontWeight:700, whiteSpace:'nowrap' }}>
          {s.label}
        </span>
      </div>

      <p style={{ fontSize:'.88rem', color:'#6B7280', margin:'0 0 16px', lineHeight:1.6,
        overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
        {order.description}
      </p>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', gap:16, fontSize:'.8rem', color:'#6B7280' }}>
          {order._count?.offers > 0 && (
            <span style={{ background:'#FEF3E8', color:'#E8700A', padding:'3px 10px', borderRadius:50, fontWeight:600 }}>
              {order._count.offers} {order._count.offers === 1 ? 'оферта' : 'оферти'}
            </span>
          )}
          {order.payment?.amount && (
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1E3A5F', fontSize:'.9rem' }}>
              {order.payment.amount.toFixed(0)} €
            </span>
          )}
          {order.budget && !order.payment && (
            <span style={{ color:'#6B7280' }}>Бюджет: {order.budget} €</span>
          )}
        </div>

        <div style={{ display:'flex', gap:8 }} onClick={e => e.stopPropagation()}>
          {order.status === 'IN_PROGRESS' && (
            <button onClick={handleComplete} style={{
              background:'#166534', color:'white', border:'none',
              padding:'8px 18px', borderRadius:50, fontSize:'.8rem', fontWeight:600,
              cursor:'pointer', transition:'background .2s',
            }}>
              ✓ Завърши поръчката
            </button>
          )}
          {order.status === 'OFFERS_RECEIVED' && (
            <button onClick={() => router.push(`/orders/${order.id}`)} style={{
              background:'#E8700A', color:'white', border:'none',
              padding:'8px 18px', borderRadius:50, fontSize:'.8rem', fontWeight:600,
              cursor:'pointer',
            }}>
              Виж офертите →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign:'center', padding:'80px 20px', background:'white', borderRadius:20, border:'2px dashed #E2E5EA' }}>
      <div style={{ fontSize:60, marginBottom:16 }}>🏠</div>
      <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1.2rem', color:'#1E3A5F', marginBottom:8 }}>
        Нямаш поръчки все още
      </h3>
      <p style={{ color:'#6B7280', fontSize:'.9rem', marginBottom:28 }}>
        Публикувай първата си заявка и получи оферти от верифицирани майстори до 4 часа.
      </p>
      <Link href="/orders/new" style={{
        background:'#E8700A', color:'white', padding:'12px 32px',
        borderRadius:50, textDecoration:'none', fontWeight:600, fontSize:'.95rem',
      }}>
        + Публикувай заявка
      </Link>
    </div>
  );
}
