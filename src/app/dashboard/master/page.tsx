// AnyFix – src/app/dashboard/master/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ordersAPI, mastersAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const LEVEL_STYLES: Record<string, { label:string; color:string; bg:string }> = {
  STAJANT:     { label:'Стажант',        color:'#6B7280', bg:'#F3F4F6' },
  MAJSTOR:     { label:'Майстор',        color:'#1D4ED8', bg:'#EFF6FF' },
  PRO_MAJSTOR: { label:'Про Майстор',    color:'#7C3AED', bg:'#F5F3FF' },
  ELIT:        { label:'Елит',           color:'#92400E', bg:'#FFFBEB' },
  CERTIFIED:   { label:'AnyFix Certified', color:'#166534', bg:'#F0FDF4' },
};
const VERIFY_LABELS: Record<string, { label:string; color:string }> = {
  PENDING:              { label:'Изчаква документи',   color:'#6B7280' },
  DOCUMENTS_SUBMITTED:  { label:'Документите получени', color:'#1D4ED8' },
  UNDER_REVIEW:         { label:'В проверка',          color:'#92400E' },
  INTERVIEW_SCHEDULED:  { label:'Насрочено интервю',   color:'#7C3AED' },
  APPROVED:             { label:'✅ Одобрен',           color:'#166534' },
  REJECTED:             { label:'❌ Отказан',           color:'#991B1B' },
};

export default function MasterDashboard() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [orders,  setOrders]  = useState<any[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'MASTER') { router.push('/dashboard/client'); return; }
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        mastersAPI.get('me' as any),
        ordersAPI.list({ limit: 20 }),
      ]);
      setProfile(profileRes.data);
      setAvailable(profileRes.data.isAvailable);
      setOrders(ordersRes.data.orders);
    } catch { toast.error('Грешка при зареждане'); }
    finally { setLoading(false); }
  }

  async function toggleAvailability() {
    try {
      await mastersAPI.update({ isAvailable: !available });
      setAvailable(v => !v);
      toast.success(!available ? 'Вече приемаш поръчки' : 'Спрял си приемането на поръчки');
    } catch { toast.error('Грешка'); }
  }

  if (!user || loading) return <LoadingSkeleton />;
  if (!profile) return null;

  const vStatus = VERIFY_LABELS[profile.verificationStatus] || { label: profile.verificationStatus, color:'#6B7280' };
  const level   = LEVEL_STYLES[profile.level] || LEVEL_STYLES.STAJANT;
  const isApproved = profile.verificationStatus === 'APPROVED';
  const needsStripe = isApproved && !profile.stripeAccountId;

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:80 }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px' }}>

        {/* Alerts */}
        {!isApproved && (
          <Alert type="info" icon="🔔">
            Профилът ти е {vStatus.label}. Качи документите за верификация, за да започнеш да получаваш поръчки.
            <Link href="/verify" style={{ color:'#E8700A', fontWeight:600, marginLeft:8 }}>Качи документи →</Link>
          </Alert>
        )}
        {needsStripe && (
          <Alert type="warn" icon="💳">
            Свържи Stripe акаунта си, за да получаваш плащания.
            <StripeConnectBtn />
          </Alert>
        )}

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#1E3A5F,#2a4f82)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:800, color:'white', fontSize:'1.3rem' }}>
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.5rem', color:'#1E3A5F', margin:0 }}>
                {user.firstName} {user.lastName}
              </h1>
              <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
                <span style={{ ...pillStyle, background:level.bg, color:level.color }}>{level.label}</span>
                <span style={{ ...pillStyle, color:vStatus.color, background:'#F3F4F6' }}>{vStatus.label}</span>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:'.82rem', color:'#6B7280', fontWeight:500 }}>
                {available ? 'Приемам поръчки' : 'Не приемам'}
              </span>
              <button onClick={toggleAvailability} style={{
                width:44, height:24, borderRadius:12,
                background: available ? '#166534' : '#D1D5DB',
                border:'none', cursor:'pointer', position:'relative', transition:'background .2s',
              }}>
                <span style={{
                  position:'absolute', top:2, left: available ? 22 : 2,
                  width:20, height:20, borderRadius:'50%', background:'white',
                  transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)',
                }} />
              </button>
            </div>
            <Link href={`/masters/${profile.id}`} style={{ ...btnStyle, background:'transparent', color:'#1E3A5F', border:'1.5px solid #E2E5EA' }}>
              Виж профила
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
          {[
            { label:'Завършени',   value: profile.completedOrders, icon:'✅' },
            { label:'Рейтинг',     value: profile.averageRating?.toFixed(1) || '–', icon:'⭐', accent:true },
            { label:'Отзиви',      value: profile.totalReviews,    icon:'💬' },
            { label:'Ниво',        value: profile.level?.replace('_',' '), icon:'🏆' },
          ].map(s => (
            <div key={s.label} style={{ background: s.accent ? '#1E3A5F' : 'white', borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 8px rgba(30,58,95,.07)' }}>
              <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.6rem', color: s.accent ? 'white' : '#1E3A5F', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'.75rem', color: s.accent ? 'rgba(255,255,255,.6)' : '#6B7280', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Level progress */}
        <LevelProgress profile={profile} />

        {/* Available orders */}
        <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1.1rem', color:'#1E3A5F', marginBottom:16, marginTop:28 }}>
          Налични поръчки в {profile.city}
        </h2>

        {!isApproved ? (
          <div style={{ textAlign:'center', padding:40, background:'white', borderRadius:16, color:'#6B7280', fontSize:'.9rem' }}>
            Верифицирай профила си, за да виждаш налични поръчки.
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, background:'white', borderRadius:16, color:'#6B7280', fontSize:'.9rem' }}>
            Няма нови поръчки в момента. Провери по-късно.
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {orders.map(o => <AvailableOrderCard key={o.id} order={o} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function LevelProgress({ profile }: { profile: any }) {
  const levels = ['STAJANT','MAJSTOR','PRO_MAJSTOR','ELIT','CERTIFIED'];
  const current = levels.indexOf(profile.level);
  const nextReqs: Record<string,string> = { STAJANT:'10 поръчки + 4.0★', MAJSTOR:'30 поръчки + 4.3★', PRO_MAJSTOR:'75 поръчки + 4.6★', ELIT:'150 поръчки + 4.8★' };

  return (
    <div style={{ background:'white', borderRadius:16, padding:'20px 24px', boxShadow:'0 2px 8px rgba(30,58,95,.07)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'.95rem', color:'#1E3A5F' }}>Прогрес към следващо ниво</span>
        {profile.level !== 'CERTIFIED' && (
          <span style={{ fontSize:'.78rem', color:'#6B7280' }}>Следващо: {nextReqs[profile.level]}</span>
        )}
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {levels.map((l, i) => (
          <div key={l} style={{ flex:1, textAlign:'center' }}>
            <div style={{ height:6, borderRadius:3, background: i <= current ? '#1E3A5F' : '#E2E5EA', marginBottom:6, transition:'background .3s' }} />
            <span style={{ fontSize:'.65rem', color: i === current ? '#E8700A' : '#9CA3AF', fontWeight: i === current ? 700 : 400 }}>
              {i+1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AvailableOrderCard({ order }: { order: any }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  return (
    <div style={{ background:'white', borderRadius:14, padding:'20px 24px', boxShadow:'0 2px 6px rgba(30,58,95,.06)', border:'1.5px solid #F0F1F3', cursor:'pointer' }}
      onClick={() => router.push(`/orders/${order.id}`)}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div>
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1E3A5F', fontSize:'.95rem' }}>{order.title}</span>
          <div style={{ fontSize:'.78rem', color:'#6B7280', marginTop:3 }}>
            📍 {order.city} · {order.category} · {order.urgency === 'URGENT' ? '🔴 Спешно' : order.urgency === 'WITHIN_3_DAYS' ? '🟡 До 3 дни' : '🟢 Гъвкаво'}
          </div>
        </div>
        {order.budget && (
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#E8700A' }}>
            up to €{order.budget}
          </span>
        )}
      </div>
      <p style={{ fontSize:'.85rem', color:'#6B7280', margin:'0 0 12px', lineHeight:1.6,
        overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
        {order.description}
      </p>
      <div style={{ display:'flex', justifyContent:'flex-end' }} onClick={e => e.stopPropagation()}>
        <button onClick={() => router.push(`/orders/${order.id}#make-offer`)} style={{
          background:'#1E3A5F', color:'white', border:'none',
          padding:'8px 20px', borderRadius:50, fontSize:'.82rem', fontWeight:600, cursor:'pointer',
        }}>
          Изпрати оферта →
        </button>
      </div>
    </div>
  );
}

function Alert({ type, icon, children }: { type:'info'|'warn'; icon:string; children: React.ReactNode }) {
  const colors = { info: { bg:'#EFF6FF', border:'#BFDBFE', text:'#1E40AF' }, warn: { bg:'#FFFBEB', border:'#FDE68A', text:'#92400E' } };
  const c = colors[type];
  return (
    <div style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:12, padding:'14px 20px', marginBottom:16, display:'flex', gap:10, alignItems:'center', fontSize:'.88rem', color:c.text, flexWrap:'wrap' }}>
      <span>{icon}</span><span style={{ flex:1 }}>{children}</span>
    </div>
  );
}

function StripeConnectBtn() {
  const [loading, setLoading] = useState(false);
  async function connect() {
    setLoading(true);
    try {
      const { data } = await mastersAPI.stripeOnboard();
      window.location.href = data.onboardingUrl;
    } catch { toast.error('Грешка при Stripe'); setLoading(false); }
  }
  return (
    <button onClick={connect} disabled={loading} style={{ background:'#635BFF', color:'white', border:'none', padding:'6px 16px', borderRadius:50, fontSize:'.8rem', fontWeight:600, cursor:'pointer', marginLeft:12 }}>
      {loading ? '...' : 'Свържи Stripe →'}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#6B7280', fontSize:'1rem' }}>Зареждане...</div>
    </div>
  );
}

const pillStyle: React.CSSProperties = { padding:'3px 12px', borderRadius:50, fontSize:'.72rem', fontWeight:700 };
const btnStyle:  React.CSSProperties = { background:'#1E3A5F', color:'white', padding:'10px 22px', borderRadius:50, textDecoration:'none', fontWeight:600, fontSize:'.85rem', display:'inline-block' };
