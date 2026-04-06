// AnyFix – src/pages/orders/[id].tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ordersAPI, paymentsAPI } from '@/lib/api';
import { useT } from '@/lib/lang';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function OrderDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { t } = useT();
  const od = t.orderDetail;
  const router   = useRouter();
  const [order,   setOrder]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  async function loadOrder() {
    try {
      const { data } = await ordersAPI.get(id);
      setOrder(data);
    } catch { toast.error(od.notFound); router.push('/dashboard'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (id) loadOrder(); }, [id]);

  async function handleAcceptOffer(offerId: string) {
    if (!confirm(od.confirmMsg)) return;
    try {
      await ordersAPI.acceptOffer(id, offerId);
      toast.success(od.offerAccepted);
      loadOrder();
    } catch (err: any) { toast.error(err?.response?.data?.error || t.common.error); }
  }

  async function handleInitPayment() {
    setPaying(true);
    try {
      const { data } = await paymentsAPI.createIntent(id);
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t.common.error);
      setPaying(false);
    }
  }

  async function handleComplete() {
    if (!confirm(od.confirmMsg)) return;
    try {
      await ordersAPI.complete(id);
      toast.success(od.orderCompleted);
      loadOrder();
    } catch (err: any) { toast.error(err?.response?.data?.error || t.common.error); }
  }

  if (loading) return <LoadingView text={t.common.loading} />;
  if (!order)  return null;

  const isClient   = user?.id === order.clientId;
  const isMaster   = user?.role === 'MASTER';
  const myOffer    = order.offers?.find((o: any) => o.masterProfile?.user?.id === user?.id);
  const hasAccepted = order.acceptedOfferId;

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:84 }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'24px 20px', display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>

        {/* ─ LEFT COLUMN ─ */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Order header */}
          <div style={{ background:'white', borderRadius:18, padding:'28px 28px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <StatusBadge status={order.status} statusLabel={(t.status as any)[order.status] || order.status} />
                <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', color:'#1E3A5F', margin:'10px 0 4px' }}>
                  {order.title}
                </h1>
                <p style={{ fontSize:'.85rem', color:'#6B7280', margin:0 }}>
                  📍 {order.address}, {order.city} · {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              {order.payment?.amount && (
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.6rem', color:'#1E3A5F' }}>
                    €{order.payment.amount.toFixed(0)}
                  </div>
                  <div style={{ fontSize:'.75rem', color:'#6B7280' }}>{od.amount}</div>
                </div>
              )}
            </div>
            <p style={{ fontSize:'.92rem', color:'#4B5563', lineHeight:1.7, margin:0 }}>{order.description}</p>

            {order.progressPhotos?.length > 0 && (
              <div style={{ marginTop:20 }}>
                <p style={{ fontSize:'.8rem', fontWeight:600, color:'#6B7280', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>
                  {od.photoProgress}
                </p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {order.progressPhotos.map((p: any) => (
                    <div key={p.id} style={{ position:'relative' }}>
                      <img src={p.imageUrl} alt={p.type} style={{ width:80, height:80, borderRadius:10, objectFit:'cover' }} />
                      <span style={{ position:'absolute', bottom:4, right:4, background:'rgba(0,0,0,.6)', color:'white', fontSize:'.6rem', padding:'2px 5px', borderRadius:4 }}>
                        {p.type === 'BEFORE' ? od.photoBefore : p.type === 'AFTER' ? od.photoAfter : od.photoProgress}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Offers section */}
          {isClient && order.offers?.length > 0 && !hasAccepted && (
            <div style={{ background:'white', borderRadius:18, padding:'24px 28px' }}>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1.05rem', color:'#1E3A5F', margin:'0 0 16px' }}>
                {od.tabs.offers} ({order.offers.length})
              </h2>
              {order.offers.map((offer: any) => (
                <OfferCard key={offer.id} offer={offer} onAccept={() => handleAcceptOffer(offer.id)} acceptLabel={od.acceptOffer} ordersLabel={od.orders} />
              ))}
            </div>
          )}

          {/* Chat */}
          <ChatPanel orderId={id} userId={user?.id || ''} chatLabel={od.tabs.chat} placeholder={od.chatPlaceholder} emptyMsg={od.chatEmpty} />

          {/* Master: Make offer form */}
          {isMaster && !myOffer && order.status === 'PUBLISHED' && (
            <MakeOfferForm orderId={id} onSuccess={loadOrder} />
          )}
          {isMaster && myOffer && (
            <div style={{ background:'#F0FDF4', borderRadius:14, padding:'16px 20px', border:'1.5px solid #BBF7D0' }}>
              <p style={{ color:'#166534', fontWeight:600, fontSize:'.88rem', margin:0 }}>
                ✅ €{myOffer.price} — {myOffer.status === 'ACCEPTED' ? od.acceptedOffer : t.common.loading}
              </p>
            </div>
          )}
        </div>

        {/* ─ RIGHT COLUMN ─ */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Payment panel */}
          {isClient && order.status === 'ACCEPTED' && !clientSecret && (
            <div style={{ background:'white', borderRadius:18, padding:'24px' }}>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1rem', color:'#1E3A5F', margin:'0 0 12px' }}>
                💳 {t.payment.title}
              </h3>
              <div style={{ background:'#EAF0F8', borderRadius:10, padding:14, marginBottom:16 }}>
                <p style={{ fontSize:'.8rem', color:'#1E3A5F', margin:0, lineHeight:1.6 }}>
                  🔒 {t.payment.escrowInfo}
                </p>
              </div>
              {order.acceptedOffer && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.85rem', color:'#6B7280', marginBottom:4 }}>
                    <span>{od.amount}</span>
                    <span>€{order.acceptedOffer.price}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.85rem', color:'#6B7280', marginBottom:8 }}>
                    <span>{t.payment.platformFee}</span>
                    <span>€{(order.acceptedOffer.price * 0.14).toFixed(0)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'Syne,sans-serif', fontWeight:800, color:'#1E3A5F', fontSize:'1rem', borderTop:'1px solid #E2E5EA', paddingTop:8 }}>
                    <span>{t.payment.total}</span>
                    <span>€{(order.acceptedOffer.price * 1.14).toFixed(0)}</span>
                  </div>
                </div>
              )}
              <button onClick={handleInitPayment} disabled={paying} style={primaryBtnStyle}>
                {paying ? t.common.loading : od.payEscrow}
              </button>
            </div>
          )}

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripePaymentForm clientSecret={clientSecret} orderId={id} onSuccess={loadOrder} />
            </Elements>
          )}

          {/* Complete button */}
          {isClient && order.status === 'IN_PROGRESS' && (
            <div style={{ background:'white', borderRadius:18, padding:'20px 24px' }}>
              <p style={{ fontSize:'.85rem', color:'#6B7280', margin:'0 0 14px', lineHeight:1.6 }}>
                {od.confirmMsg}
              </p>
              <button onClick={handleComplete} style={{ ...primaryBtnStyle, background:'#166534' }}>
                {od.confirmComplete}
              </button>
            </div>
          )}

          {/* Open dispute */}
          {isClient && order.status === 'IN_PROGRESS' && (
            <button onClick={() => router.push(`/orders/${id}/dispute`)} style={{
              background:'transparent', border:'1.5px solid #FECACA', color:'#DC2626',
              padding:'10px', borderRadius:10, cursor:'pointer', fontSize:'.82rem', fontWeight:600, width:'100%',
            }}>
              {od.openDispute}
            </button>
          )}

          {/* Accepted offer info */}
          {order.acceptedOffer && (
            <div style={{ background:'white', borderRadius:18, padding:'22px 24px' }}>
              <p style={{ fontSize:'.78rem', fontWeight:600, color:'#6B7280', margin:'0 0 12px', textTransform:'uppercase', letterSpacing:'.06em' }}>
                {od.selectedMaster}
              </p>
              <MasterMini master={order.acceptedOffer.masterProfile} ordersLabel={od.orders} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────

function OfferCard({ offer, onAccept, acceptLabel, ordersLabel }: { offer: any; onAccept: () => void; acceptLabel: string; ordersLabel: string }) {
  const m = offer.masterProfile;
  return (
    <div style={{ border:'1.5px solid #E2E5EA', borderRadius:14, padding:'18px 20px', marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <MasterMini master={m} ordersLabel={ordersLabel} />
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', color:'#1E3A5F' }}>€{offer.price}</div>
          {offer.estimatedHours && <div style={{ fontSize:'.75rem', color:'#6B7280' }}>~{offer.estimatedHours}h</div>}
        </div>
      </div>
      <p style={{ fontSize:'.85rem', color:'#4B5563', lineHeight:1.6, margin:'0 0 12px' }}>{offer.description}</p>
      <button onClick={onAccept} style={primaryBtnStyle}>{acceptLabel} →</button>
    </div>
  );
}

function MasterMini({ master, ordersLabel }: { master: any; ordersLabel: string }) {
  if (!master) return null;
  const u = master.user;
  return (
    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
      <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#1E3A5F,#2a4f82)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'.9rem', flexShrink:0 }}>
        {u?.firstName?.[0]}{u?.lastName?.[0]}
      </div>
      <div>
        <div style={{ fontWeight:600, fontSize:'.88rem', color:'#1E3A5F' }}>{u?.firstName} {u?.lastName}</div>
        <div style={{ fontSize:'.75rem', color:'#6B7280' }}>
          ⭐ {master.averageRating?.toFixed(1) || '–'} · {master.completedOrders} {ordersLabel}
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ orderId, userId, chatLabel, placeholder, emptyMsg }: { orderId:string; userId:string; chatLabel:string; placeholder:string; emptyMsg:string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text,     setText]     = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  async function send() {
    if (!text.trim()) return;
    const msg = { id: Date.now(), senderId: userId, content: text, createdAt: new Date().toISOString(), type:'TEXT' };
    setMessages(prev => [...prev, msg]);
    setText('');
  }

  return (
    <div style={{ background:'white', borderRadius:18, padding:'20px 24px' }}>
      <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1rem', color:'#1E3A5F', margin:'0 0 16px' }}>{chatLabel}</h3>
      <div style={{ height:280, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, marginBottom:14, padding:'4px 0' }}>
        {messages.length === 0 && (
          <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:'.85rem', margin:'auto' }}>
            {emptyMsg}
          </p>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ display:'flex', justifyContent: m.senderId===userId ? 'flex-end' : 'flex-start' }}>
            <div style={{
              background: m.senderId===userId ? '#1E3A5F' : '#F3F4F6',
              color: m.senderId===userId ? 'white' : '#1A1A1A',
              padding:'10px 14px', borderRadius: m.senderId===userId ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              maxWidth:'75%', fontSize:'.88rem', lineHeight:1.5,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key==='Enter' && send()}
          placeholder={placeholder}
          style={{ flex:1, padding:'11px 14px', border:'1.5px solid #E2E5EA', borderRadius:50, fontFamily:'Outfit,sans-serif', fontSize:'.88rem', outline:'none' }}
        />
        <button onClick={send} style={{ background:'#E8700A', color:'white', border:'none', padding:'0 20px', borderRadius:50, cursor:'pointer', fontSize:'1.1rem' }}>→</button>
      </div>
    </div>
  );
}

function MakeOfferForm({ orderId, onSuccess }: { orderId:string; onSuccess: () => void }) {
  const { t } = useT();
  const m = t.masterDash.offerModal;
  const [price, setPrice] = useState('');
  const [desc,  setDesc]  = useState('');
  const [hours, setHours] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!price || !desc) { toast.error(m.fillFields); return; }
    setLoading(true);
    try {
      await ordersAPI.addOffer(orderId, { price: parseFloat(price), description: desc, estimatedHours: hours ? parseFloat(hours) : undefined });
      toast.success(m.sent);
      onSuccess();
    } catch (err: any) { toast.error(err?.response?.data?.error || m.error); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ background:'white', borderRadius:18, padding:'24px 28px' }} id="make-offer">
      <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1.05rem', color:'#1E3A5F', margin:'0 0 18px' }}>
        📨 {m.title}
      </h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <label style={labelStyle}>{m.priceLabel}</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder={m.pricePlaceholder} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{m.hoursLabel}</label>
          <input type="number" value={hours} onChange={e => setHours(e.target.value)} placeholder={m.hoursPlaceholder} style={inputStyle} />
        </div>
      </div>
      <label style={labelStyle}>{m.descLabel}</label>
      <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} style={{ ...inputStyle, resize:'vertical', marginBottom:14 }}
        placeholder={m.descPlaceholder} />
      <button onClick={submit} disabled={loading} style={{ ...primaryBtnStyle, opacity: loading ? .7 : 1 }}>
        {loading ? m.submitting : `${m.submit} →`}
      </button>
    </div>
  );
}

function StripePaymentForm({ clientSecret, orderId, onSuccess }: { clientSecret:string; orderId:string; onSuccess:()=>void }) {
  const { t } = useT();
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handlePay() {
    if (!stripe || !elements) return;
    setLoading(true); setError('');
    const card = elements.getElement(CardElement);
    if (!card) return;
    const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });
    if (stripeErr) {
      setError(stripeErr.message || t.common.error);
      setLoading(false);
    } else if (paymentIntent?.status === 'requires_capture') {
      toast.success(t.payment.success);
      onSuccess();
    }
  }

  return (
    <div style={{ background:'white', borderRadius:18, padding:'24px' }}>
      <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'1rem', color:'#1E3A5F', margin:'0 0 16px' }}>💳 {t.payment.title}</h3>
      <div style={{ border:'1.5px solid #E2E5EA', borderRadius:10, padding:'14px 16px', marginBottom:16 }}>
        <CardElement options={{ style: { base: { fontFamily:'Outfit,sans-serif', fontSize:'16px', color:'#1A1A1A' } } }} />
      </div>
      {error && <p style={{ color:'#DC2626', fontSize:'.82rem', marginBottom:12 }}>{error}</p>}
      <button onClick={handlePay} disabled={loading || !stripe} style={primaryBtnStyle}>
        {loading ? t.payment.processing : `🔒 ${t.payment.title}`}
      </button>
      <p style={{ fontSize:'.72rem', color:'#9CA3AF', textAlign:'center', marginTop:8 }}>
        {t.payment.stripe}
      </p>
    </div>
  );
}

function StatusBadge({ status, statusLabel }: { status:string; statusLabel:string }) {
  const colorMap: Record<string,{color:string;bg:string}> = {
    PUBLISHED:       { color:'#1E3A5F', bg:'#EAF0F8' },
    OFFERS_RECEIVED: { color:'#92400E', bg:'#FFFBEB' },
    ACCEPTED:        { color:'#065F46', bg:'#ECFDF5' },
    IN_PROGRESS:     { color:'#1D4ED8', bg:'#EFF6FF' },
    COMPLETED:       { color:'#166534', bg:'#F0FDF4' },
    DISPUTED:        { color:'#991B1B', bg:'#FEF2F2' },
  };
  const s = colorMap[status] || { color:'#6B7280', bg:'#F3F4F6' };
  return <span style={{ background:s.bg, color:s.color, padding:'4px 14px', borderRadius:50, fontSize:'.75rem', fontWeight:700 }}>{statusLabel}</span>;
}

function LoadingView({ text }: { text: string }) {
  return (
    <div style={{ minHeight:'100vh', paddingTop:100, display:'flex', alignItems:'center', justifyContent:'center', color:'#6B7280' }}>
      {text}
    </div>
  );
}

const primaryBtnStyle: React.CSSProperties = { background:'#E8700A', color:'white', border:'none', padding:'13px', borderRadius:12, fontFamily:'Outfit,sans-serif', fontSize:'.95rem', fontWeight:600, cursor:'pointer', width:'100%', transition:'background .2s' };
const labelStyle: React.CSSProperties = { display:'block', fontWeight:600, fontSize:'.8rem', color:'#1E3A5F', marginBottom:5 };
const inputStyle: React.CSSProperties = { width:'100%', padding:'11px 14px', border:'1.5px solid #E2E5EA', borderRadius:10, fontFamily:'Outfit,sans-serif', fontSize:'.88rem', outline:'none', boxSizing:'border-box', color:'#1A1A1A' };
