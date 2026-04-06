// AnyFix – src/pages/register.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useT } from '@/lib/lang';

const schema = z.object({
  firstName: z.string().min(2, 'Enter first name'),
  lastName:  z.string().min(2, 'Enter last name'),
  email:     z.string().email('Invalid email'),
  phone:     z.string().regex(/^\+359\d{9}$/, 'Format: +359XXXXXXXXX'),
  password:  z.string().min(8, 'Minimum 8 characters'),
  role:      z.enum(['CLIENT','MASTER']),
  terms:     z.boolean().refine(v => v, 'You must accept the terms'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { setTokens } = useAuthStore();
  const { t } = useT();
  const r = t.register;
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: (params.get('role') as any) || 'CLIENT' },
  });
  const role = watch('role');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: res } = await authAPI.register(data);
      setTokens(res.accessToken, res.refreshToken);
      toast.success(r.success);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || r.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 20px 40px' }}>
      <div style={{ background:'white', borderRadius:24, padding:'40px', maxWidth:480, width:'100%', boxShadow:'0 12px 40px rgba(30,58,95,.12)' }}>

        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'2rem', color:'#1E3A5F' }}>
            Any<span style={{ color:'#E8700A' }}>Fix</span>
          </div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.4rem', fontWeight:700, color:'#1E3A5F', margin:'12px 0 4px' }}>{r.title}</h1>
          <p style={{ color:'#6B7280', fontSize:'.9rem' }}>{r.subtitle}</p>
        </div>

        {/* Role selector */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:28 }}>
          {(['CLIENT','MASTER'] as const).map(rv => (
            <button key={rv} type="button" onClick={() => setValue('role', rv)} style={{
              padding:'14px', borderRadius:12,
              border: role===rv ? '2px solid #1E3A5F' : '2px solid #E2E5EA',
              background: role===rv ? '#EAF0F8' : 'white',
              cursor:'pointer', transition:'all .2s', textAlign:'center',
            }}>
              <div style={{ fontSize:24, marginBottom:4 }}>{rv==='CLIENT' ? '🏠' : '🔧'}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'.9rem', color:'#1E3A5F' }}>
                {rv==='CLIENT' ? r.clientLabel : r.masterLabel}
              </div>
              <div style={{ fontSize:'.75rem', color:'#6B7280', marginTop:2 }}>
                {rv==='CLIENT' ? r.clientDesc : r.masterDesc}
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[['firstName', r.firstName],['lastName', r.lastName]].map(([f, label]) => (
              <div key={f}>
                <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 }}>{label}</label>
                <input {...register(f as any)} placeholder={label} style={inputStyle} />
                {errors[f as keyof FormData] && <span style={errStyle}>{(errors[f as keyof FormData] as any)?.message}</span>}
              </div>
            ))}
          </div>

          {[['email', r.email, 'email'],['phone', r.phone, 'tel'],['password', r.password, 'password']].map(([f, label, type]) => (
            <div key={f}>
              <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 }}>{label}</label>
              <input {...register(f as any)} type={type} placeholder={label} style={inputStyle} />
              {errors[f as keyof FormData] && <span style={errStyle}>{(errors[f as keyof FormData] as any)?.message}</span>}
            </div>
          ))}

          <label style={{ display:'flex', gap:10, alignItems:'flex-start', cursor:'pointer', fontSize:'.82rem', color:'#6B7280' }}>
            <input {...register('terms')} type="checkbox" style={{ marginTop:2 }} />
            <span>{r.terms} <Link href="/terms" style={{ color:'#E8700A' }}>{r.termsLink}</Link> {r.and} <Link href="/privacy" style={{ color:'#E8700A' }}>{r.privacyLink}</Link></span>
          </label>
          {errors.terms && <span style={errStyle}>{errors.terms.message}</span>}

          <button type="submit" disabled={loading} style={{
            background: loading ? '#9CA3AF' : '#E8700A',
            color:'white', border:'none', padding:'14px', borderRadius:12,
            fontFamily:'Outfit,sans-serif', fontSize:'1rem', fontWeight:600,
            cursor: loading ? 'default' : 'pointer',
            transition:'background .2s', marginTop:8,
          }}>
            {loading ? r.submitting : r.submit}
          </button>

          <p style={{ textAlign:'center', fontSize:'.85rem', color:'#6B7280', margin:0 }}>
            {r.hasAccount} <Link href="/login" style={{ color:'#E8700A', fontWeight:600 }}>{r.loginLink}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width:'100%', padding:'12px 14px',
  border:'1.5px solid #E2E5EA', borderRadius:10,
  fontFamily:'Outfit,sans-serif', fontSize:'.9rem', outline:'none',
  boxSizing:'border-box', color:'#1A1A1A',
  transition:'border-color .2s',
};
const errStyle: React.CSSProperties = {
  display:'block', fontSize:'.75rem', color:'#DC2626', marginTop:4,
};
