// AnyFix – src/app/masters/page.tsx
// Страница с всички майстори + Google Maps
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { mastersAPI } from '@/lib/api';
import { Loader } from '@googlemaps/js-api-loader';

const CATEGORIES = [
  { key:'',         label:'Всички',     icon:'🔍' },
  { key:'ELECTRIC', label:'Електро',    icon:'⚡' },
  { key:'VIK',      label:'ВиК',        icon:'🔧' },
  { key:'PAINTING', label:'Боядисване', icon:'🎨' },
  { key:'MASONRY',  label:'Зидария',    icon:'🧱' },
  { key:'TILES',    label:'Плочки',     icon:'🏗️' },
  { key:'JOINERY',  label:'Дограма',    icon:'🪟' },
  { key:'FLOORING', label:'Паркет',     icon:'🪵' },
  { key:'HANDYMAN', label:'Handyman',   icon:'🔨' },
];

const LEVEL_ICONS: Record<string, string> = {
  STAJANT:'1️⃣', MAJSTOR:'2️⃣', PRO_MAJSTOR:'3️⃣', ELIT:'4️⃣', CERTIFIED:'5️⃣',
};

function MasterCard({ master, onClick }: { master: any; onClick: () => void }) {
  const u = master.user;
  const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`;
  const avatarColors = ['#1E3A5F','#E8700A','#0f766e','#7C3AED','#D97706'];
  const color = avatarColors[u.firstName.charCodeAt(0) % avatarColors.length];

  return (
    <div onClick={onClick} style={{
      background:'white', borderRadius:16, padding:'20px',
      border:'1.5px solid #F0F1F3', cursor:'pointer', transition:'all .25s',
      boxShadow:'0 2px 8px rgba(30,58,95,.06)',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#1E3A5F'; e.currentTarget.style.boxShadow='0 8px 24px rgba(30,58,95,.14)'; e.currentTarget.style.transform='translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#F0F1F3'; e.currentTarget.style.boxShadow='0 2px 8px rgba(30,58,95,.06)'; e.currentTarget.style.transform='none'; }}
    >
      {/* Certified badge */}
      {master.level === 'CERTIFIED' && (
        <div style={{ position:'absolute', top:-8, right:12, background:'#166534', color:'white',
          fontSize:'.65rem', fontWeight:700, padding:'3px 10px', borderRadius:50 }}>
          ✅ CERTIFIED
        </div>
      )}
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:14 }}>
          <div style={{
            width:52, height:52, borderRadius:14, flexShrink:0,
            background:`linear-gradient(135deg,${color},${color}aa)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'Syne,sans-serif', fontWeight:800, color:'white', fontSize:'1.2rem',
          }}>{initials}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1E3A5F', fontSize:'.95rem' }}>
              {u.firstName} {u.lastName}
            </div>
            <div style={{ fontSize:'.78rem', color:'#9AA3AF', margin:'2px 0 4px' }}>
              {master.city} · {master.yearsExperience} г. опит
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ color:'#F59E0B', fontSize:'.82rem' }}>{'★'.repeat(Math.round(master.averageRating || 0))}</span>
              <span style={{ fontWeight:700, fontSize:'.82rem', color:'#1E3A5F' }}>{master.averageRating?.toFixed(1) || '–'}</span>
              <span style={{ fontSize:'.75rem', color:'#9AA3AF' }}>({master.totalReviews})</span>
            </div>
          </div>
          <div style={{ fontSize:'.78rem', color:'#E8700A', fontWeight:700 }}>
            {LEVEL_ICONS[master.level]} {master.level?.replace('_',' ')}
          </div>
        </div>

        {/* Categories */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
          {master.categories?.slice(0,4).map((c: any) => (
            <span key={c.category} style={{ background:'#EAF0F8', color:'#1E3A5F',
              padding:'3px 10px', borderRadius:50, fontSize:'.7rem', fontWeight:600 }}>
              {c.category}
            </span>
          ))}
        </div>

        {/* Portfolio preview */}
        {master.portfolio?.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:14 }}>
            {master.portfolio.slice(0,3).map((p: any) => (
              <img key={p.id} src={p.afterImageUrl} alt="Portfolio"
                style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:8 }} />
            ))}
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          paddingTop:12, borderTop:'1px solid #F0F1F3' }}>
          <div style={{ fontSize:'.78rem', color:'#9AA3AF' }}>
            ✅ {master.completedOrders} завършени
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:'50%',
              background: master.isAvailable ? '#22C55E' : '#E2E5EA' }} />
            <span style={{ fontSize:'.75rem', color: master.isAvailable ? '#166534' : '#9AA3AF', fontWeight:600 }}>
              {master.isAvailable ? 'Достъпен' : 'Зает'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Maps integration ─────────────────────────────────────
function MastersMap({ masters }: { masters: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
    });
    loader.load().then(() => {
      if (!mapRef.current) return;
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: 42.698, lng: 23.322 },  // Sofia
        zoom: 11,
        styles: [
          { featureType:'poi', elementType:'labels', stylers:[{ visibility:'off' }] },
          { featureType:'transit', stylers:[{ visibility:'off' }] },
        ],
        disableDefaultUI: true,
        zoomControl: true,
      });

      // Add markers for masters
      masters.forEach(m => {
        if (!m.latitude || !m.longitude) return;
        const marker = new google.maps.Marker({
          position: { lat: m.latitude, lng: m.longitude },
          map: mapInstance.current!,
          title: `${m.user.firstName} ${m.user.lastName}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="${m.level === 'CERTIFIED' ? '#166534' : '#1E3A5F'}" stroke="white" stroke-width="2"/>
                <text x="18" y="23" text-anchor="middle" font-size="14" fill="white">🔧</text>
              </svg>`),
            scaledSize: new google.maps.Size(36, 36),
          },
        });
        markers.current.push(marker);

        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="font-family:Arial;padding:8px;max-width:180px">
            <strong>${m.user.firstName} ${m.user.lastName}</strong><br>
            ⭐ ${m.averageRating?.toFixed(1)} · ${m.completedOrders} поръчки<br>
            <span style="color:#E8700A">${m.level}</span>
          </div>`,
        });
        marker.addListener('click', () => {
          infoWindow.open(mapInstance.current!, marker);
        });
      });
    });
    return () => { markers.current.forEach(m => m.setMap(null)); markers.current = []; };
  }, [masters]);

  return <div ref={mapRef} style={{ width:'100%', height:'100%', borderRadius:16 }} />;
}

// ─── Main Page ────────────────────────────────────────────
export default function MastersPage() {
  const router   = useRouter();
  const [masters, setMasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState<'grid'|'map'>('grid');
  const [filters, setFilters] = useState({ category:'', city:'София', minRating:'0' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await mastersAPI.list({
        category:  filters.category || undefined,
        city:      filters.city,
        minRating: filters.minRating,
        limit: 50,
      });
      setMasters(data.masters);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:88 }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 20px' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', color:'#1E3A5F', margin:0 }}>
              Верифицирани майстори
            </h1>
            <p style={{ color:'#9AA3AF', margin:'6px 0 0', fontSize:'.88rem' }}>
              {masters.length} специалиста · Всички преминали 7-стъпкова верификация
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {[['grid','⊞ Мрежа'],['map','🗺️ Карта']].map(([v,l]) => (
              <button key={v} onClick={() => setView(v as any)} style={{
                padding:'9px 18px', borderRadius:50, border:'1.5px solid #E2E5EA',
                background: view===v ? '#1E3A5F' : 'white',
                color: view===v ? 'white' : '#6B7280',
                cursor:'pointer', fontWeight:600, fontSize:'.85rem',
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/* ── Category chips ── */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:20 }}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setFilters(f => ({ ...f, category: c.key }))} style={{
              padding:'8px 18px', borderRadius:50, border:'1.5px solid',
              borderColor: filters.category===c.key ? '#1E3A5F' : '#E2E5EA',
              background: filters.category===c.key ? '#1E3A5F' : 'white',
              color: filters.category===c.key ? 'white' : '#6B7280',
              cursor:'pointer', fontWeight:600, fontSize:'.82rem', whiteSpace:'nowrap',
            }}>{c.icon} {c.label}</button>
          ))}
        </div>

        {/* ── Filters row ── */}
        <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
          <select value={filters.city} onChange={e => setFilters(f => ({...f, city:e.target.value}))} style={{
            padding:'10px 14px', border:'1.5px solid #E2E5EA', borderRadius:10,
            fontFamily:'Outfit,sans-serif', fontSize:'.88rem', outline:'none', background:'white',
          }}>
            {['София','Варна','Пловдив','Бургас'].map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filters.minRating} onChange={e => setFilters(f => ({...f, minRating:e.target.value}))} style={{
            padding:'10px 14px', border:'1.5px solid #E2E5EA', borderRadius:10,
            fontFamily:'Outfit,sans-serif', fontSize:'.88rem', outline:'none', background:'white',
          }}>
            <option value="0">Всички оценки</option>
            <option value="4">4★ и нагоре</option>
            <option value="4.5">4.5★ и нагоре</option>
          </select>
        </div>

        {/* ── Content ── */}
        {view === 'map' ? (
          <div style={{ height:600, borderRadius:16, overflow:'hidden', boxShadow:'0 4px 20px rgba(30,58,95,.12)' }}>
            <MastersMap masters={masters} />
          </div>
        ) : loading ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#9AA3AF' }}>Зареждане на майстори...</div>
        ) : masters.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#9AA3AF' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
            <p>Няма намерени майстори по зададените критерии</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {masters.map(m => (
              <MasterCard key={m.id} master={m} onClick={() => router.push(`/masters/${m.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
