// AnyFix – src/pages/masters/[id].tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mastersAPI, ordersAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

const CAT_LABELS: Record<string, string> = {
  ELECTRIC:'Електро', VIK:'ВиК', PAINTING:'Боядисване', MASONRY:'Зидария',
  TILES:'Плочки', JOINERY:'Дограма', FLOORING:'Паркет', HANDYMAN:'Handyman',
};
const LEVEL_META: Record<string, { label:string; color:string; desc:string }> = {
  STAJANT:     { label:'Стажант',         color:'#6B7280', desc:'Нов верифициран майстор' },
  MAJSTOR:     { label:'Майстор',          color:'#1D4ED8', desc:'10+ завършени поръчки' },
  PRO_MAJSTOR: { label:'Про Майстор',      color:'#7C3AED', desc:'30+ завършени поръчки' },
  ELIT:        { label:'Елит',             color:'#92400E', desc:'75+ завършени поръчки' },
  CERTIFIED:   { label:'AnyFix Certified', color:'#166534', desc:'150+ завършени, топ рейтинг' },
};

export default function MasterProfilePage() {
  const { id }   = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router   = useRouter();
  const [master,  setMaster]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ before:string; after:string } | null>(null);

  useEffect(() => {
    mastersAPI.get(id).then(({ data }) => setMaster(data)).catch(() => router.push('/masters')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ minHeight:'100vh', paddingTop:100, display:'flex', alignItems:'center', justifyContent:'center', color:'#6B7280' }}>Зареждане...</div>;
  if (!master)  return null;

  const u      = master.user;
  const level  = LEVEL_META[master.level] || LEVEL_META.STAJANT;
  const stars  = Math.round(master.averageRating || 0);

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:80 }}>
      <div style={{ maxWidth:980, margin:'0 auto', padding:'32px 20px', display:'grid', gridTemplateColumns:'1fr 300px', gap:28, alignItems:'start' }}>

        {/* ─ LEFT ─ */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Profile card */}
          <div style={{ background:'white', borderRadius:20, padding:'32px 28px', boxShadow:'0 2px 10px rgba(30,58,95,.08)' }}>
            <div style={{ display:'flex', gap:20, alignItems:'flex-start', marginBottom:24 }}>
              <div style={{ width:80, height:80, borderRadius:20, background:'linear-gradient(135deg,#1E3A5F,#2a4f82)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:800, color:'white', fontSize:'1.8rem', flexShrink:0 }}>
                {u.firstName[0]}{u.lastName[0]}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
                  <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.4rem', color:'#1E3A5F', margin:0 }}>
                    {u.firstName} {u.lastName}
                  </h1>
                  <span style={{ background: level.color+'15', color:level.color, padding:'4px 12px', borderRadius:50, fontSize:'.72rem', fontWeight:700 }}>
                    {level.label}
                  </span>
                  {master.isAvailable ? (
                    <span style={{ background:'#F0FDF4', color:'#166534', padding:'4px 10px', borderRadius:50, fontSize:'.72rem', fontWeight:600 }}>● Свободен</span>
                  ) : (
                    <span style={{ background:'#F9FAFB', color:'#9CA3AF', padding:'4px 10px', borderRadius:50, fontSize:'.72rem', fontWeight:600 }}>○ Зает</span>
                  )}
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <div style={{ display:'flex', gap:2 }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:18, color: s <= stars ? '#F59E0B' : '#E5E7EB' }}>★</span>)}
                  </div>
                  <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1E3A5F' }}>{master.averageRating?.toFixed(1) || '–'}</span>
                  <span style={{ color:'#6B7280', fontSize:'.85rem' }}>({master.totalReviews} отзива)</span>
                </div>

                <p style={{ color:'#6B7280', fontSize:'.85rem', margin:0 }}>
                  📍 {master.city} · {master.yearsExperience}г. опит · {master.completedOrders} завършени поръчки
                </p>
              </div>
            </div>

            {master.bio && (
              <p style={{ fontSize:'.92rem', color:'#4B5563', lineHeight:1.7, margin:'0 0 20px', padding:'16px', background:'#F8F6F2', borderRadius:12 }}>
                {master.bio}
              </p>
            )}

            {/* Categories */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {master.categories?.map((c: any) => (
                <span key={c.category} style={{ background:'#EAF0F8', color:'#1E3A5F', padding:'6px 14px', borderRadius:50, fontSize:'.8rem', fontWeight:600 }}>
                  {CAT_LABELS[c.category] || c.category}
                  {c.pricePerHour && ` · €${c.pricePerHour}/h`}
                </span>
              ))}
            </div>
          </div>

          {/* Portfolio */}
          {master.portfolio?.length > 0 && (
            <div style={{ background:'white', borderRadius:20, padding:'24px 28px', boxShadow:'0 2px 10px rgba(30,58,95,.08)' }}>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1.05rem', color:'#1E3A5F', margin:'0 0 16px' }}>
                📸 Портфолио ({master.portfolio.length} проекта)
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {master.portfolio.map((item: any) => (
                  <div key={item.id} onClick={() => setSelectedPhoto({ before:item.beforeImageUrl, after:item.afterImageUrl })}
                    style={{ borderRadius:12, overflow:'hidden', cursor:'pointer', position:'relative', aspectRatio:'1' }}>
                    <img src={item.afterImageUrl} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .3s' }} />
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,.7))', padding:'20px 10px 8px' }}>
                      <span style={{ color:'white', fontSize:'.72rem', fontWeight:600 }}>{CAT_LABELS[item.category] || item.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {master.reviewsReceived?.length > 0 && (
            <div style={{ background:'white', borderRadius:20, padding:'24px 28px', boxShadow:'0 2px 10px rgba(30,58,95,.08)' }}>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1.05rem', color:'#1E3A5F', margin:'0 0 16px' }}>
                ⭐ Отзиви
              </h2>
              {master.reviewsReceived.map((r: any) => (
                <div key={r.id} style={{ padding:'16px 0', borderBottom:'1px solid #F0F1F3' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'#EAF0F8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.8rem', fontWeight:700, color:'#1E3A5F' }}>
                        {r.client?.firstName?.[0]}
                      </div>
                      <span style={{ fontWeight:600, fontSize:'.85rem', color:'#1E3A5F' }}>{r.client?.firstName}</span>
                    </div>
                    <div style={{ display:'flex', gap:2 }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:14, color: s <= r.rating ? '#F59E0B' : '#E5E7EB' }}>★</span>)}
                    </div>
                  </div>
                  {r.comment && <p style={{ fontSize:'.88rem', color:'#4B5563', lineHeight:1.6, margin:0 }}>{r.comment}</p>}
                  {r.masterReply && (
                    <div style={{ background:'#F8F6F2', borderRadius:8, padding:'10px 14px', marginTop:8 }}>
                      <p style={{ fontSize:'.8rem', color:'#6B7280', margin:'0 0 4px', fontWeight:600 }}>Отговор на майстора:</p>
                      <p style={{ fontSize:'.85rem', color:'#4B5563', margin:0 }}>{r.masterReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─ RIGHT ─ */}
        <div style={{ display:'flex', flexDirection:'column', gap:16, position:'sticky', top:90 }}>
          <div style={{ background:'white', borderRadius:18, padding:'24px', boxShadow:'0 2px 10px rgba(30,58,95,.08)' }}>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:'.78rem', fontWeight:600, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Бързи факти</div>
              {[
                ['⭐', 'Рейтинг', `${master.averageRating?.toFixed(1) || '–'}/5`],
                ['✅', 'Завършени', `${master.completedOrders} поръчки`],
                ['⏱️', 'Отговор', `до ${master.responseTimeHours || 4} часа`],
                ['📍', 'Обслужва', `${master.city} · ${master.radiusKm}км`],
              ].map(([icon, label, val]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F0F1F3' }}>
                  <span style={{ fontSize:'.82rem', color:'#6B7280' }}>{icon} {label}</span>
                  <span style={{ fontSize:'.82rem', fontWeight:600, color:'#1E3A5F' }}>{val}</span>
                </div>
              ))}
            </div>

            {user && user.role === 'CLIENT' ? (
              <>
                <button onClick={() => setContact(true)} style={{ width:'100%', background:'#E8700A', color:'white', border:'none', padding:'14px', borderRadius:12, fontFamily:'Outfit,sans-serif', fontSize:'1rem', fontWeight:600, cursor:'pointer', marginBottom:10 }}>
                  🔧 Заяви ремонт
                </button>
                <p style={{ textAlign:'center', fontSize:'.72rem', color:'#9CA3AF', margin:0 }}>
                  Платформата осигурява ескроу защита
                </p>
              </>
            ) : (
              <button onClick={() => router.push('/register')} style={{ width:'100%', background:'#1E3A5F', color:'white', border:'none', padding:'14px', borderRadius:12, fontFamily:'Outfit,sans-serif', fontSize:'1rem', fontWeight:600, cursor:'pointer' }}>
                Регистрирай се за контакт
              </button>
            )}
          </div>

          {/* Trust badges */}
          <div style={{ background:'#EAF0F8', borderRadius:14, padding:'16px 18px' }}>
            <p style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'.85rem', color:'#1E3A5F', margin:'0 0 10px' }}>AnyFix гарантира</p>
            {['✅ Верифициран профил', '🔒 Ескроу плащане', '📸 Снимки преди/след', '⚖️ Медиация при спор'].map(t => (
              <p key={t} style={{ fontSize:'.78rem', color:'#1E3A5F', margin:'5px 0', fontWeight:500 }}>{t}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Before/After lightbox */}
      {selectedPhoto && (
        <div onClick={() => setSelectedPhoto(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', gap:20, padding:20 }}>
          {[['Преди', selectedPhoto.before], ['След', selectedPhoto.after]].map(([label, src]) => (
            <div key={label} style={{ textAlign:'center' }} onClick={e => e.stopPropagation()}>
              <span style={{ color:'white', fontSize:'.8rem', fontWeight:600, marginBottom:8, display:'block' }}>{label}</span>
              <img src={src} alt={label} style={{ maxHeight:'75vh', maxWidth:'42vw', borderRadius:12, objectFit:'contain' }} />
            </div>
          ))}
          <button onClick={() => setSelectedPhoto(null)} style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,.15)', border:'none', color:'white', width:36, height:36, borderRadius:'50%', cursor:'pointer', fontSize:'1.1rem' }}>✕</button>
        </div>
      )}
    </div>
  );
}
