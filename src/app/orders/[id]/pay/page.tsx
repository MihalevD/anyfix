// AnyFix – src/app/orders/[id]/pay/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentsAPI, ordersAPI } from '@/lib/api';
import { useT } from '@/lib/lang';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── Inner form (must be inside Elements) ─────────────────
function CheckoutForm({ orderId, amount }: { orderId: string; amount: number }) {
  const { t } = useT();
  const p = t.payment;
  const stripe   = useStripe();
  const elements = useElements();
  const router   = useRouter();
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setLoading(true); setError('');

    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}?payment=success`,
      },
      redirect: 'if_required',
    });

    if (err) {
      setError(err.message || t.common.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push(`/orders/${orderId}`), 2000);
    }
  };

  if (success) return (
    <div style={{ textAlign:'center', padding:'40px' }}>
      <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
      <h2 style={{ fontFamily:'Syne,sans-serif', color:'#166534', fontWeight:800 }}>{p.success}</h2>
      <p style={{ color:'#6B7280' }}>{p.successSub}</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <PaymentElement options={{
          layout: 'tabs',
          fields: { billingDetails: { address: 'never' } },
        }} />
      </div>

      {error && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10,
          padding:'12px 14px', color:'#991B1B', fontSize:'.85rem', marginBottom:16 }}>
          ⚠️ {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading || !stripe} style={{
        width:'100%', background: loading ? '#9CA3AF' : '#166534',
        color:'white', border:'none', padding:'16px', borderRadius:12,
        fontFamily:'Outfit,sans-serif', fontSize:'1rem', fontWeight:600,
        cursor: loading ? 'default' : 'pointer',
      }}>
        {loading ? p.processing : `🔒 ${p.payBtn.replace('{amount}', amount.toLocaleString())}`}
      </button>

      <div style={{ marginTop:16, background:'#F0FDF4', borderRadius:10, padding:'12px 14px',
        fontSize:'.8rem', color:'#166534', display:'flex', gap:8 }}>
        <span>🛡️</span>
        <div>
          <strong>{p.escrowTitle}</strong> {p.escrowInfo}
        </div>
      </div>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────
export default function PaymentPage() {
  const { t } = useT();
  const p = t.payment;
  const { id }      = useParams() as { id: string };
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [order,        setOrder]        = useState<any>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const secret = searchParams.get('clientSecret');
    if (secret) {
      setClientSecret(secret);
      ordersAPI.get(id).then(r => setOrder(r.data)).finally(() => setLoading(false));
    } else {
      paymentsAPI.createIntent(id)
        .then(r => {
          setClientSecret(r.data.clientSecret);
          return ordersAPI.get(id);
        })
        .then(r => setOrder(r.data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', paddingTop:88 }}>
      <div style={{ color:'#9AA3AF' }}>{p.loadingPayment}</div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:88,
      display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'100px 20px 40px' }}>
      <div style={{ maxWidth:560, width:'100%' }}>

        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'2rem', color:'#1E3A5F' }}>
            Any<span style={{ color:'#E8700A' }}>Fix</span>
          </div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.5rem', color:'#1E3A5F', margin:'12px 0 4px' }}>
            {p.title}
          </h1>
          <p style={{ color:'#9AA3AF', fontSize:'.9rem' }}>{p.subtitle}</p>
        </div>

        {order && (
          <div style={{ background:'white', borderRadius:16, padding:'20px', marginBottom:20,
            boxShadow:'0 2px 12px rgba(30,58,95,.08)' }}>
            <div style={{ fontWeight:700, color:'#1E3A5F', fontSize:'.95rem', marginBottom:12 }}>
              {p.summary}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:'.88rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:'#6B7280' }}>{order.title}</span>
                <strong>€{order.acceptedOffer?.price?.toLocaleString()}</strong>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:'#6B7280' }}>{p.platformFee}</span>
                <span style={{ color:'#6B7280' }}>{p.feeIncluded}</span>
              </div>
              <div style={{ height:1, background:'#F0F1F3', margin:'4px 0' }} />
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <strong>{p.total}</strong>
                <strong style={{ color:'#1E3A5F' }}>€{order.payment?.amount?.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        <div style={{ background:'white', borderRadius:20, padding:'28px',
          boxShadow:'0 2px 12px rgba(30,58,95,.08)' }}>
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: { colorPrimary:'#1E3A5F', fontFamily:'Outfit, sans-serif' },
              },
              locale: 'en',
            }}>
              <CheckoutForm orderId={id} amount={order?.payment?.amount || 0} />
            </Elements>
          ) : (
            <div style={{ textAlign:'center', padding:'40px', color:'#9AA3AF' }}>
              {p.loadingForm}
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:'.78rem', color:'#9AA3AF' }}>
          {p.stripe}
        </div>
      </div>
    </div>
  );
}
