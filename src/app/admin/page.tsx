// AnyFix – src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { adminAPI } from '@/lib/api';
import { useT } from '@/lib/lang';
import toast from 'react-hot-toast';

// ─── Stat Card ─────────────────────────────────────────────
function KpiCard({ icon, label, value, color, onClick }: any) {
  return (
    <div onClick={onClick} style={{
      background:'white', borderRadius:16, padding:'22px',
      boxShadow:'0 2px 12px rgba(30,58,95,.08)',
      border:`2px solid ${color}20`,
      cursor: onClick ? 'pointer' : 'default',
      transition:'all .2s',
    }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = `${color}20`)}
    >
      <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.9rem', color }}>{value}</div>
      <div style={{ fontSize:'.82rem', color:'#6B7280', marginTop:4, fontWeight:500 }}>{label}</div>
    </div>
  );
}

// ─── Master Row ────────────────────────────────────────────
function MasterRow({ master, onAction }: { master: any; onAction: () => void }) {
  const { t } = useT();
  const a = t.admin;
  const [loading, setLoading] = useState(false);
  const u = master.user;

  const act = async (action: string, note?: string) => {
    setLoading(true);
    try {
      await adminAPI.updateMaster(master.id, { action, note });
      toast.success(a.masterRow.approvedMsg(action));
      onAction();
    } catch { toast.error(t.common.error); }
    finally { setLoading(false); }
  };

  const statusColors: Record<string, { c: string; bg: string }> = {
    PENDING:              { c:'#6B7280', bg:'#F3F4F6' },
    DOCUMENTS_SUBMITTED:  { c:'#92400E', bg:'#FFFBEB' },
    UNDER_REVIEW:         { c:'#1D4ED8', bg:'#EFF6FF' },
    INTERVIEW_SCHEDULED:  { c:'#7C3AED', bg:'#FAF5FF' },
    APPROVED:             { c:'#166534', bg:'#F0FDF4' },
    REJECTED:             { c:'#991B1B', bg:'#FEF2F2' },
  };
  const sm = statusColors[master.verificationStatus] || { c:'#6B7280', bg:'#F3F4F6' };
  const verLabel = (a.verStatus as any)[master.verificationStatus] || master.verificationStatus;

  return (
    <div style={{ padding:'16px 20px', border:'1.5px solid #F0F1F3', borderRadius:12,
      background:'white', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
      <div style={{
        width:44, height:44, borderRadius:12, flexShrink:0,
        background:'linear-gradient(135deg,#1E3A5F,#E8700A)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'Syne,sans-serif', fontWeight:800, color:'white',
      }}>
        {u?.firstName?.[0]}{u?.lastName?.[0]}
      </div>
      <div style={{ flex:1, minWidth:180 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1E3A5F' }}>
          {u?.firstName} {u?.lastName}
        </div>
        <div style={{ fontSize:'.78rem', color:'#9AA3AF' }}>
          {u?.email} · {u?.phone}
        </div>
        <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
          {master.categories?.map((c: any) => (
            <span key={c.category} style={{ background:'#EAF0F8', color:'#1E3A5F',
              padding:'2px 10px', borderRadius:50, fontSize:'.7rem', fontWeight:600 }}>
              {c.category}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
        <span style={{ background: sm.bg, color: sm.c, padding:'4px 12px',
          borderRadius:50, fontSize:'.75rem', fontWeight:700 }}>
          {verLabel}
        </span>
        <div style={{ fontSize:'.75rem', color:'#9AA3AF' }}>
          {master.documents?.length || 0} {a.masterRow.documents}
        </div>
      </div>
      {['DOCUMENTS_SUBMITTED','UNDER_REVIEW','INTERVIEW_SCHEDULED'].includes(master.verificationStatus) && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={() => act('APPROVE')} disabled={loading} style={{
            background:'#166534', color:'white', border:'none',
            padding:'8px 16px', borderRadius:50, cursor:'pointer', fontSize:'.78rem', fontWeight:600,
          }}>{a.masterRow.approve}</button>
          <button onClick={() => act('SCHEDULE_INTERVIEW')} disabled={loading} style={{
            background:'#7C3AED', color:'white', border:'none',
            padding:'8px 16px', borderRadius:50, cursor:'pointer', fontSize:'.78rem', fontWeight:600,
          }}>{a.masterRow.interview}</button>
          <button onClick={() => {
            const note = prompt(a.masterRow.rejectPrompt);
            if (note) act('REJECT', note);
          }} disabled={loading} style={{
            background:'#FEF2F2', color:'#991B1B', border:'1px solid #FECACA',
            padding:'8px 16px', borderRadius:50, cursor:'pointer', fontSize:'.78rem', fontWeight:600,
          }}>{a.masterRow.reject}</button>
        </div>
      )}
    </div>
  );
}

// ─── Dispute Row ───────────────────────────────────────────
function DisputeRow({ dispute, onAction }: { dispute: any; onAction: () => void }) {
  const { t } = useT();
  const a = t.admin;
  const order = dispute.order;
  const [loading, setLoading] = useState(false);

  const resolve = async (action: string) => {
    const resolution = prompt(a.disputeRow.decisionPrompt);
    if (!resolution) return;
    setLoading(true);
    try {
      await adminAPI.resolveDispute(dispute.id, { action, resolution });
      toast.success(a.disputeRow.resolved);
      onAction();
    } catch { toast.error(t.common.error); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding:'16px 20px', border:'1.5px solid #FECACA', borderRadius:12, background:'#FEF2F2' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#991B1B' }}>
            ⚠️ {order?.title}
          </div>
          <div style={{ fontSize:'.78rem', color:'#6B7280', margin:'4px 0' }}>
            {a.disputeRow.client}: {order?.client?.firstName} {order?.client?.lastName} ·
            {a.disputeRow.amount}: €{order?.payment?.amount?.toLocaleString()}
          </div>
          <div style={{ fontSize:'.85rem', color:'#1A1A1A', marginTop:6 }}>
            <strong>{a.disputeRow.reason}</strong> {dispute.reason}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={() => resolve('RESOLVE_CLIENT')} disabled={loading} style={{
            background:'#991B1B', color:'white', border:'none',
            padding:'8px 16px', borderRadius:50, cursor:'pointer', fontSize:'.78rem', fontWeight:600,
          }}>{a.disputeRow.refundClient}</button>
          <button onClick={() => resolve('RESOLVE_MASTER')} disabled={loading} style={{
            background:'#166534', color:'white', border:'none',
            padding:'8px 16px', borderRadius:50, cursor:'pointer', fontSize:'.78rem', fontWeight:600,
          }}>{a.disputeRow.releaseMaster}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────
export default function AdminPage() {
  const { user }   = useAuthStore();
  const { t } = useT();
  const a = t.admin;
  const router     = useRouter();
  const [stats,    setStats]    = useState<any>(null);
  const [masters,  setMasters]  = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [fraud,    setFraud]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('overview');
  const [search,   setSearch]   = useState('');
  const [verFilter, setVerFilter] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    init();
  }, [user]);

  const init = async () => {
    setLoading(true);
    try {
      const [statsRes, mastersRes, disputesRes, fraudRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getMasters({ status: verFilter || undefined, search: search || undefined }),
        adminAPI.getDisputes({ status:'OPEN' }),
        adminAPI.getFraudLogs(),
      ]);
      setStats(statsRes.data);
      setMasters(mastersRes.data.masters);
      setDisputes(disputesRes.data.disputes);
      setFraud(fraudRes.data);
    } catch { toast.error(t.common.error); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.role === 'ADMIN') init(); }, [search, verFilter]);

  if (!user) return null;

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:88 }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 20px' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32 }}>
          <div style={{ flex:1 }}>
            <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', color:'#1E3A5F', margin:0 }}>
              {a.title}
            </h1>
            <p style={{ color:'#9AA3AF', margin:'4px 0 0', fontSize:'.88rem' }}>
              {a.subtitle}
            </p>
          </div>
        </div>

        {/* ── KPI row ── */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
            <KpiCard icon="👥" label={a.kpi.users}        value={stats.totalUsers}         color="#1E3A5F" />
            <KpiCard icon="🔧" label={a.kpi.masters}      value={stats.totalMasters}        color="#1E3A5F" onClick={() => setTab('masters')} />
            <KpiCard icon="⏳" label={a.kpi.pending}      value={stats.pendingVerification} color="#E8700A" onClick={() => { setTab('masters'); setVerFilter('DOCUMENTS_SUBMITTED'); }} />
            <KpiCard icon="💰" label={a.kpi.revenue}      value={`€${(stats.totalRevenue || 0).toLocaleString()}`} color="#166534" />
            <KpiCard icon="📋" label={a.kpi.activeOrders} value={stats.activeOrders}        color="#1D4ED8" />
            <KpiCard icon="⚠️" label={a.kpi.disputes}     value={stats.openDisputes}        color="#991B1B" onClick={() => setTab('disputes')} />
            <KpiCard icon="🚨" label={a.kpi.fraud}        value={stats.flaggedMessages}     color="#DC2626" onClick={() => setTab('fraud')} />
            <KpiCard icon="📊" label={a.kpi.totalOrders}  value={stats.totalOrders}         color="#6B7280" />
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ background:'white', borderRadius:20, boxShadow:'0 2px 12px rgba(30,58,95,.08)', overflow:'hidden' }}>
          <div style={{ display:'flex', borderBottom:'1.5px solid #F0F1F3', padding:'0 20px', overflowX:'auto' }}>
            {[
              ['overview', a.tabs.overview],
              ['masters',  a.tabs.masters],
              ['disputes', a.tabs.disputes],
              ['fraud',    a.tabs.fraud],
            ].map(([key,label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding:'15px 16px', border:'none', background:'transparent', cursor:'pointer',
                fontFamily:'Outfit,sans-serif', fontSize:'.85rem', whiteSpace:'nowrap',
                fontWeight: tab===key ? 600 : 400,
                color: tab===key ? '#1E3A5F' : '#9AA3AF',
                borderBottom: tab===key ? '2.5px solid #E8700A' : '2.5px solid transparent',
                marginBottom:'-1.5px',
              }}>{label}</button>
            ))}
          </div>

          <div style={{ padding:'20px' }}>

            {tab === 'overview' && (
              <div>
                <h3 style={{ fontFamily:'Syne,sans-serif', color:'#1E3A5F', margin:'0 0 16px' }}>{a.overview.title}</h3>
                {disputes.slice(0,3).map(d => (
                  <DisputeRow key={d.id} dispute={d} onAction={init} />
                ))}
                {masters.filter(m => m.verificationStatus === 'DOCUMENTS_SUBMITTED').slice(0,3).map(m => (
                  <MasterRow key={m.id} master={m} onAction={init} />
                ))}
              </div>
            )}

            {tab === 'masters' && (
              <div>
                <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={a.masters.searchPlaceholder}
                    style={{ flex:1, minWidth:200, padding:'10px 14px', border:'1.5px solid #E2E5EA',
                      borderRadius:10, fontFamily:'Outfit,sans-serif', fontSize:'.88rem', outline:'none' }} />
                  <select value={verFilter} onChange={e => setVerFilter(e.target.value)} style={{
                    padding:'10px 14px', border:'1.5px solid #E2E5EA', borderRadius:10,
                    fontFamily:'Outfit,sans-serif', fontSize:'.88rem', outline:'none',
                  }}>
                    <option value="">{a.masters.allStatuses}</option>
                    {(Object.entries(a.verStatus) as [string,string][]).map(([k,v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {loading ? (
                    <div style={{ textAlign:'center', padding:'40px', color:'#9AA3AF' }}>{t.common.loading}</div>
                  ) : masters.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'40px', color:'#9AA3AF' }}>{a.noResults}</div>
                  ) : masters.map(m => <MasterRow key={m.id} master={m} onAction={init} />)}
                </div>
              </div>
            )}

            {tab === 'disputes' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {disputes.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'48px', color:'#9AA3AF' }}>
                    <div style={{ fontSize:48, marginBottom:10 }}>🕊️</div>
                    <p>{a.noDisputes}</p>
                  </div>
                ) : disputes.map(d => <DisputeRow key={d.id} dispute={d} onAction={init} />)}
              </div>
            )}

            {tab === 'fraud' && (
              <div>
                <div style={{ background:'#FEF2F2', borderRadius:12, padding:'14px 16px', marginBottom:16,
                  fontSize:'.85rem', color:'#991B1B', border:'1px solid #FECACA' }}>
                  {a.fraud.warning}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {fraud.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'40px', color:'#9AA3AF' }}>{a.fraud.none}</div>
                  ) : fraud.map((log: any) => (
                    <div key={log.id} style={{ background:'white', borderRadius:12, padding:'16px',
                      border:'1.5px solid #FECACA' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                        <div>
                          <div style={{ fontWeight:700, color:'#991B1B', fontSize:'.9rem' }}>
                            {log.user?.firstName} {log.user?.lastName} · {log.user?.role}
                          </div>
                          <div style={{ fontSize:'.78rem', color:'#6B7280', margin:'4px 0' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                          <div style={{ fontSize:'.82rem', color:'#1A1A1A', marginTop:6 }}>
                            {a.fraud.detected} <strong>{log.metadata?.reasons?.join(', ')}</strong>
                            {' · '}{a.fraud.score} <strong style={{ color:'#DC2626' }}>{log.metadata?.score}</strong>
                          </div>
                        </div>
                        <button onClick={async () => {
                          await adminAPI.updateMaster(log.entityId || '', { action:'SUSPEND', note: a.fraud.fraudAttempt });
                          toast.success(a.fraud.suspended);
                          init();
                        }} style={{
                          background:'#991B1B', color:'white', border:'none',
                          padding:'8px 16px', borderRadius:50, cursor:'pointer', fontSize:'.78rem', fontWeight:600,
                        }}>{a.fraud.suspend}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
