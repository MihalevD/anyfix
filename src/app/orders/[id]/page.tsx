// AnyFix – src/app/orders/[id]/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ordersAPI, paymentsAPI } from '@/lib/api';
import { useT } from '@/lib/lang';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

// ─── Chat Component ───────────────────────────────────────
function ChatPanel({ orderId, currentUserId }: { orderId: string; currentUserId: string }) {
  const { t } = useT();
  const od = t.orderDetail;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, `orders/${orderId}/messages`),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => endRef.current?.scrollIntoView({ behavior:'smooth' }), 50);
    });
    return () => unsub();
  }, [orderId]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const fraudPatterns = [/\+359|08[789]\d{7}|@gmail|@abv|viber|whatsapp|директно|в брой/gi];
    if (fraudPatterns.some(p => p.test(trimmed))) {
      toast.error(od.chatFraud);
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, `orders/${orderId}/messages`), {
        content:   trimmed,
        senderId:  currentUserId,
        type:      'TEXT',
        createdAt: serverTimestamp(),
      });
      setText('');
    } finally { setSending(false); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:400 }}>
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign:'center', color:'#9AA3AF', padding:'40px 20px' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>💬</div>
            <p style={{ fontSize:'.85rem' }}>{od.chatEmpty}</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === currentUserId;
          const isSystem = msg.type === 'SYSTEM';
          if (isSystem) return (
            <div key={msg.id} style={{
              background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:10,
              padding:'10px 14px', fontSize:'.8rem', color:'#92400E', textAlign:'center',
            }}>{msg.content}</div>
          );
          return (
            <div key={msg.id} style={{ display:'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth:'72%', padding:'10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMe ? '#1E3A5F' : '#F3F4F6',
                color: isMe ? 'white' : '#1A1A1A', fontSize:'.88rem', lineHeight:1.5,
              }}>{msg.content}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div style={{ padding:'12px', borderTop:'1.5px solid #F0F1F3', display:'flex', gap:8 }}>
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder={od.chatPlaceholder}
          style={{ flex:1, padding:'11px 14px', border:'1.5px solid #E2E5EA', borderRadius:10,
            fontFamily:'Outfit,sans-serif', fontSize:'.88rem', outline:'none' }}
        />
        <button onClick={send} disabled={sending || !text.trim()} style={{
          background: (sending || !text.trim()) ? '#E2E5EA' : '#1E3A5F',
          color:'white', border:'none', padding:'11px 18px', borderRadius:10,
          cursor: (sending || !text.trim()) ? 'default' : 'pointer', fontWeight:600,
        }}>➤</button>
      </div>
      <div style={{ padding:'6px 12px', fontSize:'.72rem', color:'#9AA3AF' }}>
        {od.chatWarning}
      </div>
    </div>
  );
}

// ─── Photo Upload ─────────────────────────────────────────
function PhotoSection({ orderId, type, photos }: { orderId: string; type: string; photos: any[] }) {
  const { t } = useT();
  const od = t.orderDetail;
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      form.append('type', type);
      await ordersAPI.uploadPhoto(orderId, form);
      toast.success(od.photoUploaded);
    } catch { toast.error(od.photoError); }
    finally { setUploading(false); }
  };

  const label = type === 'BEFORE' ? od.photoBefore : type === 'AFTER' ? od.photoAfter : od.photoProgress;

  return (
    <div>
      <div style={{ fontWeight:600, fontSize:'.85rem', color:'#1E3A5F', marginBottom:8 }}>{label}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {photos.filter(p => p.type === type).map(p => (
          <img key={p.id} src={p.imageUrl} alt={type}
            style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:10 }} />
        ))}
        <div onClick={() => !uploading && input.current?.click()} style={{
          aspectRatio:'1', borderRadius:10, border:'2px dashed #E2E5EA',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', background:'#F9FAFB', fontSize:24,
          color: uploading ? '#9AA3AF' : '#9AA3AF',
          transition:'border-color .2s',
        }}>
          {uploading ? '⏳' : '+'}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function OrderPage() {
  const { id }       = useParams() as { id: string };
  const router       = useRouter();
  const { user }     = useAuthStore();
  const { t } = useT();
  const od = t.orderDetail;
  const [order,   setOrder]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(false);
  const [tab,     setTab]     = useState('offers');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ordersAPI.get(id);
      setOrder(data);
    } catch { toast.error(od.notFound); router.push('/dashboard'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (user) load(); else router.push('/login'); }, [user]);

  const acceptOffer = async (offerId: string) => {
    try {
      await ordersAPI.acceptOffer(id, offerId);
      toast.success(od.offerAccepted);
      load();
    } catch (e: any) { toast.error(e?.response?.data?.error || t.common.error); }
  };

  const initiatePayment = async () => {
    setPaying(true);
    try {
      const { data } = await paymentsAPI.createIntent(id);
      router.push(`/orders/${id}/pay?clientSecret=${data.clientSecret}`);
    } catch (e: any) { toast.error(e?.response?.data?.error || t.common.error); }
    finally { setPaying(false); }
  };

  const completeOrder = async () => {
    if (!confirm(od.confirmMsg)) return;
    try {
      await ordersAPI.complete(id);
      toast.success(od.orderCompleted);
      load();
    } catch (e: any) { toast.error(e?.response?.data?.error || t.common.error); }
  };

  const openDispute = async () => {
    const reason = prompt(od.disputePrompt);
    if (!reason) return;
    try {
      await ordersAPI.openDispute(id, { reason, description: reason });
      toast.success(od.disputeOpened);
      load();
    } catch { toast.error(t.common.error); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', paddingTop:88 }}>
      <div style={{ color:'#9AA3AF', fontSize:'1.1rem' }}>{t.common.loading}</div>
    </div>
  );
  if (!order) return null;

  const isClient  = user?.id === order.clientId;
  const accepted  = order.acceptedOffer;
  const canPay    = isClient && order.status === 'ACCEPTED' && order.payment?.status === 'PENDING';
  const canComplete = isClient && order.status === 'IN_PROGRESS';
  const statusMeta = { color:'#1E3A5F', bg:'#EAF0F8' };
  const statusLabel = (t.status as any)[order.status] || order.status;

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:88 }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px' }}>

        {/* ── Breadcrumb ── */}
        <div style={{ fontSize:'.82rem', color:'#9AA3AF', marginBottom:20 }}>
          <span onClick={() => router.push('/dashboard')} style={{ cursor:'pointer', color:'#E8700A' }}>{od.breadcrumb}</span>
          {' › '}{order.title.slice(0, 40)}...
        </div>

        {/* ── Order Header ── */}
        <div style={{ background:'white', borderRadius:20, padding:'28px', marginBottom:20,
          boxShadow:'0 2px 12px rgba(30,58,95,.08)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
            <div style={{ flex:1 }}>
              <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.4rem', color:'#1E3A5F', margin:0 }}>
                {order.title}
              </h1>
              <div style={{ color:'#9AA3AF', fontSize:'.85rem', marginTop:6 }}>
                {order.city} · {new Date(order.createdAt).toLocaleDateString()}
                {order.budget && ` · ${od.upTo} €${order.budget.toLocaleString()}`}
              </div>
            </div>
            <span style={{ background: statusMeta.bg, color: statusMeta.color,
              padding:'6px 16px', borderRadius:50, fontSize:'.82rem', fontWeight:700 }}>
              {statusLabel}
            </span>
          </div>

          {order.description && (
            <div style={{ marginTop:16, padding:'14px 16px', background:'#F9FAFB',
              borderRadius:10, fontSize:'.9rem', color:'#5A6370', lineHeight:1.7 }}>
              {order.description}
            </div>
          )}

          {/* ── Action buttons ── */}
          <div style={{ display:'flex', gap:10, marginTop:20, flexWrap:'wrap' }}>
            {canPay && (
              <button onClick={initiatePayment} disabled={paying} style={{
                background:'#166534', color:'white', border:'none',
                padding:'12px 24px', borderRadius:50, cursor:'pointer',
                fontWeight:600, fontSize:'.9rem',
              }}>
                {paying ? t.common.loading : od.payEscrow}
              </button>
            )}
            {canComplete && (
              <>
                <button onClick={completeOrder} style={{
                  background:'#1E3A5F', color:'white', border:'none',
                  padding:'12px 24px', borderRadius:50, cursor:'pointer', fontWeight:600, fontSize:'.9rem',
                }}>{od.confirmComplete}</button>
                <button onClick={openDispute} style={{
                  background:'white', color:'#991B1B', border:'1.5px solid #FCA5A5',
                  padding:'12px 24px', borderRadius:50, cursor:'pointer', fontWeight:600, fontSize:'.9rem',
                }}>{od.openDispute}</button>
              </>
            )}
          </div>

          {/* Escrow info */}
          {order.payment?.status === 'HELD_IN_ESCROW' && (
            <div style={{ marginTop:16, background:'#F0FDF4', border:'1px solid #86EFAC',
              borderRadius:10, padding:'12px 16px', fontSize:'.82rem', color:'#166534' }}>
              🔒 <strong>€{order.payment.amount.toLocaleString()}</strong> {od.escrowHeld}
            </div>
          )}
        </div>

        {/* ── Content grid ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20 }}>

          {/* Left: Tabs */}
          <div style={{ background:'white', borderRadius:20, boxShadow:'0 2px 12px rgba(30,58,95,.08)', overflow:'hidden' }}>
            <div style={{ display:'flex', borderBottom:'1.5px solid #F0F1F3', padding:'0 16px' }}>
              {[
                ['offers', `${od.tabs.offers} (${order.offers?.length || 0})`],
                ['chat',   od.tabs.chat],
                ['photos', od.tabs.photos],
              ].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  padding:'14px 16px', border:'none', background:'transparent', cursor:'pointer',
                  fontFamily:'Outfit,sans-serif', fontSize:'.85rem',
                  fontWeight: tab===key ? 600 : 400,
                  color: tab===key ? '#1E3A5F' : '#9AA3AF',
                  borderBottom: tab===key ? '2.5px solid #E8700A' : '2.5px solid transparent',
                  marginBottom:'-1.5px',
                }}>{label}</button>
              ))}
            </div>

            {/* Offers tab */}
            {tab === 'offers' && (
              <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
                {(!order.offers || order.offers.length === 0) ? (
                  <div style={{ textAlign:'center', padding:'48px 20px', color:'#9AA3AF' }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>⏳</div>
                    <p>{od.waitingOffers}</p>
                  </div>
                ) : order.offers.map((offer: any) => {
                  const m = offer.masterProfile;
                  const isAccepted = offer.id === order.acceptedOfferId;
                  return (
                    <div key={offer.id} style={{
                      border: isAccepted ? '2px solid #1E3A5F' : '1.5px solid #F0F1F3',
                      borderRadius:14, padding:'18px', background: isAccepted ? '#EAF0F8' : 'white',
                    }}>
                      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                        <div style={{
                          width:48, height:48, borderRadius:12, flexShrink:0,
                          background:'linear-gradient(135deg,#1E3A5F,#2a4f82)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontFamily:'Syne,sans-serif', fontWeight:800, color:'white', fontSize:'1.1rem',
                        }}>
                          {m?.user?.firstName?.[0]}{m?.user?.lastName?.[0]}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1E3A5F' }}>
                            {m?.user?.firstName} {m?.user?.lastName}
                          </div>
                          <div style={{ fontSize:'.78rem', color:'#9AA3AF', margin:'2px 0 6px' }}>
                            ⭐ {m?.averageRating?.toFixed(1)} · {m?.completedOrders} {od.orders} · {m?.level}
                          </div>
                          <div style={{ fontSize:'.88rem', color:'#5A6370', lineHeight:1.6 }}>{offer.description}</div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontFamily:'Syne,sans-serif', fontSize:'1.3rem', fontWeight:800, color:'#1E3A5F' }}>
                            €{offer.price.toLocaleString()}
                          </div>
                          {offer.estimatedHours && (
                            <div style={{ fontSize:'.75rem', color:'#9AA3AF' }}>~{offer.estimatedHours}{od.estimatedHours}</div>
                          )}
                        </div>
                      </div>
                      {isClient && !accepted && offer.status === 'PENDING' && (
                        <button onClick={() => acceptOffer(offer.id)} style={{
                          marginTop:14, width:'100%', background:'#1E3A5F', color:'white',
                          border:'none', padding:'11px', borderRadius:10,
                          fontWeight:600, cursor:'pointer', fontSize:'.88rem',
                        }}>{od.acceptOffer}</button>
                      )}
                      {isAccepted && (
                        <div style={{ marginTop:10, textAlign:'center', fontSize:'.8rem',
                          color:'#166534', fontWeight:700 }}>✓ {od.acceptedOffer}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'chat' && (
              <ChatPanel orderId={id} currentUserId={user?.id || ''} />
            )}

            {tab === 'photos' && (
              <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:20 }}>
                {['BEFORE','PROGRESS','AFTER'].map(type => (
                  <PhotoSection key={type} orderId={id} type={type} photos={order.progressPhotos || []} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Master info */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {accepted && (
              <div style={{ background:'white', borderRadius:20, padding:'24px',
                boxShadow:'0 2px 12px rgba(30,58,95,.08)' }}>
                <div style={{ fontWeight:700, color:'#1E3A5F', fontFamily:'Syne,sans-serif', marginBottom:16 }}>
                  {od.selectedMaster}
                </div>
                <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
                  <div style={{
                    width:56, height:56, borderRadius:14,
                    background:'linear-gradient(135deg,#1E3A5F,#E8700A)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'Syne,sans-serif', fontWeight:800, color:'white', fontSize:'1.2rem',
                  }}>
                    {accepted.masterProfile?.user?.firstName?.[0]}{accepted.masterProfile?.user?.lastName?.[0]}
                  </div>
                  <div>
                    <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:'#1E3A5F' }}>
                      {accepted.masterProfile?.user?.firstName} {accepted.masterProfile?.user?.lastName}
                    </div>
                    <div style={{ fontSize:'.8rem', color:'#9AA3AF' }}>
                      ⭐ {accepted.masterProfile?.averageRating?.toFixed(1)} · {accepted.masterProfile?.level}
                    </div>
                  </div>
                </div>
                <div style={{ background:'#F9FAFB', borderRadius:10, padding:'12px', fontSize:'.85rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ color:'#6B7280' }}>{od.amount}</span>
                    <strong>€{accepted.price.toLocaleString()}</strong>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#6B7280' }}>{od.escrowStatus}</span>
                    <strong style={{ color: order.payment?.status === 'HELD_IN_ESCROW' ? '#166534' : '#6B7280' }}>
                      {order.payment?.status === 'HELD_IN_ESCROW' ? od.held :
                       order.payment?.status === 'RELEASED'       ? od.released : od.pending}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {order.status === 'COMPLETED' && isClient && !order.review && (
              <div style={{ background:'#FEF3E8', border:'1.5px solid #FD974A',
                borderRadius:16, padding:'20px' }}>
                <div style={{ fontWeight:700, color:'#92400E', marginBottom:8 }}>
                  {od.leaveReview}
                </div>
                <p style={{ color:'#92400E', fontSize:'.85rem', margin:'0 0 12px' }}>
                  {od.reviewHelps}
                </p>
                <button onClick={() => router.push(`/orders/${id}/review`)} style={{
                  background:'#E8700A', color:'white', border:'none',
                  padding:'10px 20px', borderRadius:50, cursor:'pointer', fontWeight:600,
                }}>{od.leaveReviewBtn}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
