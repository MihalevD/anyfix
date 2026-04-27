// AnyFix – src/pages/orders/new.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { ordersAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const schema = z.object({
  category:    z.string().min(1, 'Избери категория'),
  title:       z.string().min(10, 'Поне 10 символа'),
  description: z.string().min(30, 'Поне 30 символа – по-подробното описание носи по-добри оферти'),
  address:     z.string().min(5, 'Въведи адрес'),
  city:        z.string().min(1, 'Избери град'),
  urgency:     z.string().default('FLEXIBLE'),
  budget:      z.string().optional(),
});
type F = z.infer<typeof schema>;

const CATEGORIES = [
  { key:'ELECTRIC', label:'Електро',     icon:'⚡', hint:'Инсталации, аварии, табла' },
  { key:'VIK',      label:'ВиК',         icon:'🔧', hint:'Водопровод, канализация' },
  { key:'PAINTING', label:'Боядисване',  icon:'🎨', hint:'Интериор, декоративни покрития' },
  { key:'MASONRY',  label:'Зидария',     icon:'🧱', hint:'Шпакловка, гипсокартон' },
  { key:'TILES',    label:'Плочки',      icon:'🏗️', hint:'Фаянс, теракот' },
  { key:'JOINERY',  label:'Дограма',     icon:'🪟', hint:'Прозорци, врати' },
  { key:'FLOORING', label:'Паркет',      icon:'🪵', hint:'Ламинат, настилки' },
  { key:'HANDYMAN', label:'Handyman',    icon:'🔨', hint:'Дребни ремонти, монтажи' },
];
const CITIES    = ['София', 'Варна', 'Пловдив', 'Бургас', 'Стара Загора', 'Русе', 'Плевен', 'Велико Търново'];
const URGENCIES = [
  { key:'URGENT',        label:'Спешно',     sub:'До 24 часа',   icon:'🔴' },
  { key:'WITHIN_3_DAYS', label:'До 3 дни',   sub:'',             icon:'🟡' },
  { key:'FLEXIBLE',      label:'Гъвкаво',    sub:'По договаряне', icon:'🟢' },
];

export default function NewOrderPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [step,    setStep]    = useState(1);  // 1:Category, 2:Details, 3:Confirm
  const [photos,  setPhotos]  = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { urgency:'FLEXIBLE' },
  });

  const category = watch('category');
  const urgency  = watch('urgency');

  const onDrop = useCallback((accepted: File[]) => {
    setPhotos(prev => [...prev, ...accepted].slice(0, 6));
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 6,
  });

  async function handleNext() {
    const fields: (keyof F)[] = step === 1 ? ['category'] : ['title','description','address','city'];
    const ok = await trigger(fields);
    if (ok) setStep(s => s + 1);
  }

  const onSubmit = async (data: F) => {
    if (!user) { toast.error('Влез в акаунта си'); router.push('/login'); return; }
    setLoading(true);
    try {
      const payload = { ...data, budget: data.budget ? parseFloat(data.budget) : undefined };
      const { data: order } = await ordersAPI.create(payload);
      toast.success('Заявката е публикувана! Очаквай оферти до 4 часа.');
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Грешка при публикуване');
    } finally { setLoading(false); }
  };

  const selectedCat = CATEGORIES.find(c => c.key === category);

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:96, paddingBottom:60 }}>
      <div style={{ maxWidth:680, margin:'0 auto', padding:'0 20px' }}>

        {/* Progress */}
        <div style={{ display:'flex', gap:0, marginBottom:36 }}>
          {['Категория','Детайли','Потвърждение'].map((s, i) => (
            <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
                {i > 0 && <div style={{ flex:1, height:2, background: i < step ? '#1E3A5F' : '#E2E5EA', transition:'background .3s' }} />}
                <div style={{
                  width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  background: i+1 < step ? '#1E3A5F' : i+1 === step ? '#E8700A' : '#E2E5EA',
                  color: i+1 <= step ? 'white' : '#9CA3AF',
                  fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'.85rem', flexShrink:0, transition:'all .3s',
                }}>
                  {i+1 < step ? '✓' : i+1}
                </div>
                {i < 2 && <div style={{ flex:1, height:2, background: i+1 < step ? '#1E3A5F' : '#E2E5EA', transition:'background .3s' }} />}
              </div>
              <span style={{ fontSize:'.72rem', color: i+1 === step ? '#E8700A' : '#6B7280', marginTop:6, fontWeight: i+1 === step ? 600 : 400 }}>{s}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* STEP 1: Category */}
          {step === 1 && (
            <Card title="Какъв ремонт търсиш?" sub="Избери категорията на услугата">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {CATEGORIES.map(cat => (
                  <label key={cat.key} style={{
                    border: category === cat.key ? '2px solid #1E3A5F' : '2px solid #E2E5EA',
                    background: category === cat.key ? '#EAF0F8' : 'white',
                    borderRadius:14, padding:'18px 16px', cursor:'pointer',
                    transition:'all .2s', display:'block',
                  }}>
                    <input type="radio" {...register('category')} value={cat.key} style={{ display:'none' }} />
                    <div style={{ fontSize:28, marginBottom:8 }}>{cat.icon}</div>
                    <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'.95rem', color:'#1E3A5F', marginBottom:3 }}>{cat.label}</div>
                    <div style={{ fontSize:'.75rem', color:'#6B7280' }}>{cat.hint}</div>
                  </label>
                ))}
              </div>
              {errors.category && <ErrMsg>{errors.category.message}</ErrMsg>}
              <NavBtn onClick={handleNext} disabled={!category}>Продължи →</NavBtn>
            </Card>
          )}

          {/* STEP 2: Details */}
          {step === 2 && (
            <Card title={`${selectedCat?.icon} ${selectedCat?.label}`} sub="Опиши подробно нуждата си">
              <FormField label="Заглавие на поръчката" error={errors.title?.message}>
                <input {...register('title')} placeholder="напр. Смяна на ВиК инсталация в баня" style={inputStyle} />
              </FormField>

              <FormField label="Подробно описание" error={errors.description?.message}
                hint="По-подробното описание носи по-точни оферти от майсторите.">
                <textarea {...register('description')} rows={5} style={{ ...inputStyle, resize:'vertical' }}
                  placeholder="Опиши какво точно трябва да се направи, площ, текущо състояние, предпочитания за материали..." />
              </FormField>

              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
                <FormField label="Адрес" error={errors.address?.message}>
                  <input {...register('address')} placeholder="ул. Витоша 15, ет. 3" style={inputStyle} />
                </FormField>
                <FormField label="Град" error={errors.city?.message}>
                  <select {...register('city')} style={inputStyle}>
                    <option value="">Избери...</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="Спешност">
                <div style={{ display:'flex', gap:10 }}>
                  {URGENCIES.map(u => (
                    <label key={u.key} style={{
                      flex:1, border: urgency === u.key ? '2px solid #1E3A5F' : '2px solid #E2E5EA',
                      background: urgency === u.key ? '#EAF0F8' : 'white',
                      borderRadius:12, padding:'12px', cursor:'pointer', textAlign:'center', transition:'all .2s',
                    }}>
                      <input type="radio" {...register('urgency')} value={u.key} style={{ display:'none' }} />
                      <div style={{ fontSize:18, marginBottom:4 }}>{u.icon}</div>
                      <div style={{ fontSize:'.8rem', fontWeight:600, color:'#1E3A5F' }}>{u.label}</div>
                      {u.sub && <div style={{ fontSize:'.7rem', color:'#6B7280' }}>{u.sub}</div>}
                    </label>
                  ))}
                </div>
              </FormField>

              <FormField label="Budget (€) – optional" hint="An approximate budget helps masters give a more accurate offer.">
                <input {...register('budget')} type="number" placeholder="напр. 500" style={inputStyle} />
              </FormField>

              <FormField label="Снимки – незадължително (до 6)" hint="Снимки на проблема помагат значително.">
                <div {...getRootProps()} style={{
                  border: isDragActive ? '2px dashed #1E3A5F' : '2px dashed #E2E5EA',
                  borderRadius:12, padding:24, textAlign:'center', cursor:'pointer',
                  background: isDragActive ? '#EAF0F8' : '#FAFAFA', transition:'all .2s',
                }}>
                  <input {...getInputProps()} />
                  {photos.length > 0 ? (
                    <div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
                        {photos.map((f, i) => (
                          <div key={i} style={{ width:72, height:72, borderRadius:8, overflow:'hidden', position:'relative' }}>
                            <img src={URL.createObjectURL(f)} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize:'.75rem', color:'#6B7280', marginTop:8 }}>{photos.length}/6 снимки · Кликни за добавяне</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize:32, marginBottom:8 }}>📷</div>
                      <p style={{ fontSize:'.85rem', color:'#6B7280', margin:0 }}>Провлечи снимки тук или кликни за избор</p>
                    </>
                  )}
                </div>
              </FormField>

              <div style={{ display:'flex', gap:12 }}>
                <button type="button" onClick={() => setStep(1)} style={{ ...backBtnStyle }}>← Назад</button>
                <NavBtn onClick={handleNext} style={{ flex:1 }}>Продължи →</NavBtn>
              </div>
            </Card>
          )}

          {/* STEP 3: Confirm */}
          {step === 3 && (
            <Card title="Прегледай заявката" sub="Увери се, че всичко е вярно преди публикуване">
              {[
                ['Категория', `${selectedCat?.icon} ${selectedCat?.label}`],
                ['Заглавие', watch('title')],
                ['Описание', watch('description')],
                ['Адрес', `${watch('address')}, ${watch('city')}`],
                ['Спешност', URGENCIES.find(u => u.key === urgency)?.label || urgency],
                ['Budget', watch('budget') ? `€${watch('budget')}` : 'Not specified'],
                ['Снимки', `${photos.length} снимки`],
              ].map(([l, v]) => (
                <div key={l} style={{ display:'flex', gap:16, padding:'12px 0', borderBottom:'1px solid #F0F1F3' }}>
                  <span style={{ fontSize:'.82rem', fontWeight:600, color:'#6B7280', minWidth:90 }}>{l}</span>
                  <span style={{ fontSize:'.88rem', color:'#1A1A1A', flex:1 }}>{v}</span>
                </div>
              ))}

              <div style={{ background:'#FEF3E8', borderRadius:12, padding:16, marginTop:20 }}>
                <p style={{ fontSize:'.82rem', color:'#92400E', margin:0, lineHeight:1.6 }}>
                  🔔 След публикуване AnyFix ще нотифицира верифицираните майстори в твоя район.
                  Очаквай оферти до 4 часа. Регистрацията е напълно безплатна.
                </p>
              </div>

              <div style={{ display:'flex', gap:12, marginTop:4 }}>
                <button type="button" onClick={() => setStep(2)} style={backBtnStyle}>← Назад</button>
                <button type="submit" disabled={loading} style={{
                  flex:1, background: loading ? '#9CA3AF' : '#E8700A',
                  color:'white', border:'none', padding:'15px', borderRadius:12,
                  fontFamily:'Outfit,sans-serif', fontSize:'1rem', fontWeight:700,
                  cursor: loading ? 'default' : 'pointer', transition:'background .2s',
                }}>
                  {loading ? 'Публикуване...' : '🚀 Публикувай заявката'}
                </button>
              </div>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
}

function Card({ title, sub, children }: { title:string; sub:string; children:React.ReactNode }) {
  return (
    <div style={{ background:'white', borderRadius:20, padding:'36px 32px', boxShadow:'0 4px 20px rgba(30,58,95,.09)' }}>
      <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', color:'#1E3A5F', margin:'0 0 4px' }}>{title}</h2>
      <p style={{ color:'#6B7280', fontSize:'.88rem', margin:'0 0 28px' }}>{sub}</p>
      {children}
    </div>
  );
}

function FormField({ label, error, hint, children }: { label:string; error?:string; hint?:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:20 }}>
      <label style={{ display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 }}>{label}</label>
      {children}
      {hint  && <p style={{ fontSize:'.74rem', color:'#9CA3AF', margin:'5px 0 0' }}>{hint}</p>}
      {error && <ErrMsg>{error}</ErrMsg>}
    </div>
  );
}

function NavBtn({ onClick, disabled, children, style }: any) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      background: disabled ? '#E2E5EA' : '#1E3A5F',
      color: disabled ? '#9CA3AF' : 'white',
      border:'none', padding:'14px 28px', borderRadius:12,
      fontFamily:'Outfit,sans-serif', fontSize:'1rem', fontWeight:600,
      cursor: disabled ? 'default' : 'pointer', width:'100%', marginTop:24,
      transition:'background .2s', ...style,
    }}>
      {children}
    </button>
  );
}

function ErrMsg({ children }: { children: React.ReactNode }) {
  return <span style={{ display:'block', fontSize:'.74rem', color:'#DC2626', marginTop:4 }}>{children}</span>;
}

const inputStyle: React.CSSProperties = { width:'100%', padding:'12px 14px', border:'1.5px solid #E2E5EA', borderRadius:10, fontFamily:'Outfit,sans-serif', fontSize:'.9rem', outline:'none', boxSizing:'border-box', color:'#1A1A1A', background:'white' };
const backBtnStyle: React.CSSProperties = { background:'transparent', border:'1.5px solid #E2E5EA', color:'#6B7280', padding:'14px 20px', borderRadius:12, fontFamily:'Outfit,sans-serif', fontSize:'.9rem', fontWeight:600, cursor:'pointer', marginTop:24 };
