# ИНСТРУКЦИИ ЗА ХОСТИНГ – ANYFIX
## Пълно ръководство за продукционен деплой

---

## АРХИТЕКТУРА НА ХОСТИНГА (Препоръчана – ~20 EUR/месец)

```
anyfix.bg             → Vercel (Frontend – БЕЗПЛАТНО)
api.anyfix.bg         → Railway (Backend – ~5 EUR/мес)
db.anyfix.bg          → Supabase PostgreSQL (– БЕЗПЛАТНО до 500MB)
cache                 → Upstash Redis (– БЕЗПЛАТНО до 10,000 req/ден)
files                 → AWS S3 eu-west-1 (~2 EUR/мес)
email                 → SendGrid (БЕЗПЛАТНО до 100 имейла/ден)
sms                   → Twilio (~0.05 EUR/SMS)
payments              → Stripe Connect (1.5% + 0.25 EUR/транзакция)
push                  → Firebase (БЕЗПЛАТНО)
```

---

## СТЪПКА 1: База данни – Supabase

1. Регистрирай се на supabase.com
2. Създай нов проект (избери регион: Frankfurt EU)
3. Копирай Connection String от Settings → Database
4. Постави в `DATABASE_URL` в backend `.env`

```bash
cd backend
npx prisma migrate deploy    # Прилага migration в prod
npx prisma db seed           # (опционално) Seed данни
```

---

## СТЪПКА 2: Redis – Upstash

1. Регистрирай се на upstash.com
2. Създай Redis database (регион: EU-West-1)
3. Копирай `REDIS_URL` от конзолата
4. Постави в backend `.env`

---

## СТЪПКА 3: AWS S3

1. Влез в AWS Console → S3 → Create Bucket
2. Bucket name: `anyfix-uploads-prod`
3. Region: `eu-west-1` (Ирландия – ЕС, GDPR)
4. Block Public Access: ВКЛ (документите са private)
5. Създай IAM User с политика:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject","s3:PutObject","s3:DeleteObject"],
    "Resource": "arn:aws:s3:::anyfix-uploads-prod/*"
  }]
}
```
6. Копирай Access Key и Secret в `.env`

---

## СТЪПКА 4: Stripe

1. Регистрирай се на stripe.com → Dashboard
2. Включи Stripe Connect (за майстори)
3. Копирай Secret Key и Publishable Key
4. Webhooks → Add endpoint: `https://api.anyfix.bg/api/webhooks/stripe`
   - Events: payment_intent.succeeded, payment_intent.failed, account.updated
5. Копирай Webhook Secret

---

## СТЪПКА 5: Firebase

1. firebase.google.com → Create Project "anyfix-prod"
2. Enable: Authentication, Firestore, Cloud Messaging
3. Project Settings → Service Accounts → Generate new private key
4. Постави стойностите в backend `.env`
5. Frontend: копирай firebaseConfig в `.env.local`

---

## СТЪПКА 6: Backend деплой – Railway

1. railway.app → New Project → Deploy from GitHub
2. Избери репото `anyfix/backend`
3. Add Variables: всички от `.env` файла
4. Settings → Custom Domain: `api.anyfix.bg`
5. Добави CNAME запис в DNS: `api → anyfix-backend.railway.app`

```bash
# Тест:
curl https://api.anyfix.bg/health
# Очакван отговор: {"status":"ok"}
```

---

## СТЪПКА 7: Frontend деплой – Vercel

1. vercel.com → Import Git Repository → anyfix/frontend
2. Framework Preset: Next.js
3. Environment Variables: добави всички от `.env.local`
4. Settings → Domains: `anyfix.bg` и `www.anyfix.bg`
5. DNS: добави A record → 76.76.21.21 (Vercel IP)

```bash
# Тест:
curl https://anyfix.bg
```

---

## СТЪПКА 8: SSL сертификати

Vercel и Railway издават автоматични SSL сертификати (Let's Encrypt).
**Не е нужно ръчно настройване.**

---

## СТЪПКА 9: DNS настройки (в регистратора – напр. Register.bg)

```
@          A      76.76.21.21        (Vercel – anyfix.bg)
www        CNAME  cname.vercel-dns.com
api        CNAME  anyfix-backend.railway.app
```

---

## МОНИТОРИНГ (препоръчано)

| Инструмент | Цел | Разход |
|---|---|---|
| Sentry (sentry.io) | Грешки в реално време | Безплатно |
| Uptime Robot | Мониторинг на uptime | Безплатно |
| Railway Metrics | CPU, Memory, Requests | Включено |
| Stripe Dashboard | Плащания и транзакции | Включено |
| Google Search Console | SEO мониторинг | Безплатно |

---

## BACKUP СТРАТЕГИЯ

**База данни:** Supabase прави автоматичен backup на всеки 24 часа (Free Plan).
**Файлове (S3):** Активирай S3 Versioning в настройките на bucket-а.
**Код:** Всичко е в GitHub – самото repo е backup.

---

## CHECKLIST ПРЕДИ ЖИВО

- [ ] `NODE_ENV=production` в Railway
- [ ] JWT_SECRET е 64+ символа (не default стойност!)
- [ ] Stripe е в live mode (не test)
- [ ] GDPR Cookie banner е активен
- [ ] Privacy Policy и Общи условия са качени
- [ ] Домейн verified в SendGrid (DKIM/SPF записи)
- [ ] Google Analytics 4 е настроен
- [ ] Sentry е свързан
- [ ] Проведи тест поръчка от край до край
- [ ] Тествай Stripe webhook локално с `stripe listen`

---

*Изготвено за AnyFix – anyfix.bg*
