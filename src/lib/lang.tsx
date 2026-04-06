'use client';
// AnyFix – language context + translations (BG / EN)

import { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'bg' | 'en';

// ─── Translations ──────────────────────────────────────────
const translations = {
  bg: {
    // Nav
    nav: {
      home: 'Начало', masters: 'Майстори', howItWorks: 'Как работи',
      login: 'Вход', register: 'Регистрация', logout: 'Изход', dashboard: 'Табло',
    },
    // Footer
    footer: {
      description: 'Дигитална платформа, свързваща собственици на имоти с верифицирани специалисти.',
      services: 'Услуги', forMasters: 'За майстори', company: 'AnyFix',
      copyright: '© 2026 AnyFix. Всички права запазени.',
      terms: 'Условия', privacy: 'Поверителност', cookies: 'Бисквитки',
      links: {
        services: [['ВиК','/c/vik'],['Електро','/c/electric'],['Боядисване','/c/painting'],['Зидария','/c/masonry']],
        forMasters: [['Регистрация','/register?role=MASTER'],['AnyFix Levels','/levels'],['Верификация','/verify']],
        company: [['За нас','/about'],['Блог','/blog'],['Поддръжка','/support'],['Условия','/terms'],['Поверителност','/privacy']],
      },
    },
    // Common
    common: {
      loading: 'Зареждане...', error: 'Грешка', cancel: 'Отказ',
      save: 'Запази', send: 'Изпрати', confirm: 'Потвърди',
      noResults: 'Няма резултати', currency: '€',
    },
    // Status labels
    status: {
      DRAFT: 'Чернова', PUBLISHED: 'Публикувана', OFFERS_RECEIVED: 'Получени оферти',
      ACCEPTED: 'Приета', IN_PROGRESS: 'В прогрес', COMPLETED: 'Завършена',
      DISPUTED: 'В спор', CANCELLED: 'Отказана',
    },
    // Categories
    categories: {
      ELECTRIC: '⚡ Електро', VIK: '🔧 ВиК', PAINTING: '🎨 Боядисване',
      MASONRY: '🧱 Зидария', TILES: '🏗️ Плочки', JOINERY: '🪟 Дограма',
      FLOORING: '🪵 Паркет', HANDYMAN: '🔨 Handyman',
    },
    // Urgency
    urgency: {
      URGENT: '🚨 Спешно (24ч)', WITHIN_3_DAYS: '📅 До 3 дни', FLEXIBLE: '🗓️ Гъвкаво',
    },
    // Login
    login: {
      subtitle: 'Влез в акаунта си',
      email: 'Имейл адрес', password: 'Парола',
      forgotPassword: 'Забравена парола?',
      submit: 'Влез →', submitting: 'Влизане...',
      noAccount: 'Нямаш акаунт?', registerLink: 'Регистрирай се',
      success: 'Добре дошъл!', error: 'Невалиден имейл или парола',
    },
    // Register
    register: {
      title: 'Създай акаунт', subtitle: 'Безплатно. Без карта.',
      clientLabel: 'Клиент', masterLabel: 'Майстор',
      clientDesc: 'Търсиш майстор', masterDesc: 'Предлагаш услуги',
      firstName: 'Собствено име', lastName: 'Фамилно име',
      email: 'Имейл', phone: 'Телефон (+359XXXXXXXXX)', password: 'Парола',
      terms: 'Приемам', termsLink: 'Общите условия', and: 'и', privacyLink: 'Политиката за поверителност',
      submit: 'Създай акаунт →', submitting: 'Регистриране...',
      hasAccount: 'Имаш акаунт?', loginLink: 'Влез тук',
      success: 'Регистрацията е успешна! Провери имейла си.', error: 'Грешка при регистрация',
    },
    // Client Dashboard
    clientDash: {
      welcome: 'Добре дошъл,', subtitle: 'Управлявай своите поръчки за ремонти',
      newOrder: '➕ Нова заявка',
      stats: {
        active: 'Активни поръчки', activesSub: 'в момента',
        pending: 'Чакат решение', pendingSub: 'нови оферти',
        completed: 'Завършени', completedSub: 'успешно',
        spent: 'Похарчено', spentSub: 'общо',
      },
      alert: { title: 'Имаш', orders: 'поръчка с нови оферти!', sub: 'Прегледай офертите и избери майстор.', btn: 'Прегледай' },
      tabs: { active: 'Активни', completed: 'Завършени', disputes: 'Спорове' },
      empty: 'Нямаш поръчки в тази категория',
      createFirst: 'Създай първата си заявка',
      offers: 'оферти', loadError: 'Грешка при зареждане',
    },
    // New Order Modal
    newOrder: {
      title: '🔧 Нова заявка за ремонт',
      category: 'Категория', titleField: 'Заглавие',
      titleHint: '(мин. 10 символа)',
      description: 'Описание', descHint: '(мин. 30 символа)',
      descPlaceholder: 'Опиши подробно какво трябва да се направи, размерите, специфики...',
      titlePlaceholder: 'напр. Смяна на ВиК инсталация в баня',
      city: 'Град', urgency: 'Срочност',
      budget: 'Приблизителен бюджет (€)', budgetOptional: '– незадължително',
      budgetPlaceholder: 'напр. 800',
      info: 'Верифицираните майстори в района ти ще получат известие и ще изпратят оферти до 4 часа.',
      infoLabel: 'ℹ️ Следващи стъпки:',
      submit: '📢 Публикувай заявката →', submitting: 'Публикуване...',
      errorFields: 'Попълни всички полета',
      errorDesc: 'Описанието трябва да е поне 30 символа',
      success: 'Поръчката е публикувана! Майсторите ще бъдат уведомени.',
      createError: 'Грешка при създаване',
      cities: ['София','Варна','Пловдив','Бургас','Стара Загора','Русе','Плевен'],
    },
    // Order Detail
    orderDetail: {
      breadcrumb: 'Табло',
      upTo: 'До',
      payEscrow: '🔒 Плати чрез ескроу →', payLoading: 'Зареждане...',
      confirmComplete: '✅ Потвърди завършването',
      openDispute: '⚠️ Отвори спор',
      confirmMsg: 'Потвърди, че работата е завършена и сте доволни. Ескроуто ще бъде освободено.',
      disputePrompt: 'Опиши проблема:',
      escrowHeld: 'са в ескроу – ще бъдат освободени след твоето потвърждение.',
      offerAccepted: 'Офертата е приета! Продължи към плащане.',
      orderCompleted: 'Поръчката е завършена! Средствата са освободени към майстора.',
      disputeOpened: 'Спорът е открит. AnyFix ще разгледа в 3 работни дни.',
      notFound: 'Поръчката не е намерена',
      tabs: { offers: 'Оферти', chat: 'Чат 💬', photos: 'Снимки 📸' },
      waitingOffers: 'Очакваш оферти от майстори...',
      acceptOffer: '✅ Приеми тази оферта',
      acceptedOffer: '✓ ПРИЕТА ОФЕРТА',
      orders: 'поръчки',
      chatEmpty: 'Чатът е активен след приемане на оферта',
      chatPlaceholder: 'Напиши съобщение... (Enter за изпращане)',
      chatWarning: '🔒 Телефони и имейли в чата са забранени. Плащанията само чрез AnyFix.',
      chatFraud: '⚠️ Личните контакти не са разрешени в чата. Плащанията само чрез AnyFix.',
      photoBefore: '📸 Преди работата', photoAfter: '✅ След работата', photoProgress: '📷 Прогрес',
      photoUploaded: 'Снимката е качена!', photoError: 'Грешка при качване',
      selectedMaster: '🔧 Избран майстор',
      amount: 'Сума', escrowStatus: 'Ескроу статус',
      held: '🔒 Задържано', released: '✅ Освободено', pending: '⏳ Изчакване',
      leaveReview: '⭐ Остави оценка',
      reviewHelps: 'Твоята оценка помага на другите клиенти.',
      leaveReviewBtn: 'Остави оценка',
      estimatedHours: 'ч',
    },
    // Payment
    payment: {
      title: 'Сигурно плащане',
      subtitle: 'Ескроу защита – плащаш само за завършена работа',
      summary: '📋 Резюме на поръчката',
      platformFee: 'Такса платформа', feeIncluded: 'Включена',
      total: 'Общо (в ескроу)',
      payBtn: '🔒 Плати €{amount} в ескроу',
      processing: 'Обработка...',
      escrowInfo: 'Средствата се задържат сигурно и се освобождават към майстора само след твоето потвърждение за завършена работа.',
      escrowTitle: 'Защита с ескроу:',
      success: 'Плащането е успешно!', successSub: 'Средствата са в ескроу. Пренасочване...',
      loadingPayment: 'Зареждане на плащане...', loadingForm: 'Зареждане на формата...',
      stripe: '🔒 Защитено от Stripe · Данните ти са криптирани · PCI DSS Level 1',
    },
    // Master Dashboard
    masterDash: {
      hello: 'Здравей,', emoji: '🔧',
      completedOrders: 'поръчки',
      thisWeek: 'Тази седмица',
      tabs: { available: 'Налични заявки', mine: 'Моите поръчки' },
      noAvailable: 'Няма налични заявки в момента',
      noMine: 'Нямаш активни поръчки',
      offerBtn: 'Оферта',
      verifyTitle: 'Верификационен прогрес',
      verifySub: 'Завърши верификацията, за да получаваш поръчки',
      verifyContinue: 'Продължи верификацията →',
      verifySteps: ['Регистрация','Документи','Преглед','Интервю','Одобрен ✅'],
      profileBtn: '✏️ Профил', stripeBtn: '💳 Свържи Stripe',
      offerModal: {
        title: 'Изпрати оферта',
        priceLabel: 'Цена (€) *', hoursLabel: 'Часове (прибл.)',
        descLabel: 'Описание на офертата *',
        descPlaceholder: 'Опиши как ще изпълниш поръчката, материали, гаранция...',
        pricePlaceholder: 'напр. 350', hoursPlaceholder: 'напр. 4',
        yourEarnings: 'Твоят приход:', afterFee: '(след 14% комисия)',
        submit: '📤 Изпрати офертата', submitting: 'Изпращане...',
        sent: 'Офертата е изпратена!', error: 'Грешка при изпращане',
        fillFields: 'Попълни всички полета',
      },
      stats: { active: 'Активни поръчки', response: 'Средно реагиране', rating: 'Рейтинг' },
      nextLevel: '🏆 До следващо ниво',
      loadError: 'Грешка при зареждане',
      urgency: { URGENT: '🚨 Спешно', WITHIN_3_DAYS: '📅 До 3 дни', FLEXIBLE: '🗓️ Гъвкаво' },
      upTo: 'До',
    },
    // Admin
    admin: {
      title: '🛡️ AnyFix Admin',
      subtitle: 'Управление на платформата',
      kpi: {
        users: 'Общо потребители', masters: 'Активни майстори',
        pending: 'Чакат верификация', revenue: 'Приходи (€)',
        activeOrders: 'Активни поръчки', disputes: 'Отворени спорове',
        fraud: 'Fraud сигнали', totalOrders: 'Общо поръчки',
      },
      tabs: { overview: '📊 Обзор', masters: '🔧 Майстори', disputes: '⚠️ Спорове', fraud: '🚨 Fraud' },
      overview: { title: 'Действия, изискващи внимание' },
      masters: { searchPlaceholder: '🔍 Търси по име или имейл...', allStatuses: 'Всички статуси' },
      verStatus: {
        PENDING: 'Pending', DOCUMENTS_SUBMITTED: 'Документи подадени',
        UNDER_REVIEW: 'В преглед', INTERVIEW_SCHEDULED: 'Интервю насрочено',
        APPROVED: 'Одобрени', REJECTED: 'Отхвърлени',
      },
      masterRow: {
        documents: 'документа',
        approve: '✅ Одобри', interview: '📅 Интервю', reject: '❌ Откажи',
        rejectPrompt: 'Причина за отхвърляне:',
        approvedMsg: (a: string) => `Майсторът е ${a === 'APPROVE' ? 'одобрен' : a === 'REJECT' ? 'отхвърлен' : 'насрочен за интервю'}`,
      },
      disputeRow: {
        client: 'Клиент', amount: 'Сума',
        reason: 'Причина:', decisionPrompt: 'Решение:',
        refundClient: 'Върни на клиента', releaseMaster: 'Освободи на майстора',
        resolved: 'Спорът е разрешен',
      },
      fraud: {
        warning: '🚨 Следните потребители са засечени с опит за офлайн договаряне. Прегледай съобщенията и предприеми действие.',
        none: 'Няма fraud сигнали',
        detected: 'Засечено:', score: 'Скор:',
        suspend: 'Суспендирай', suspended: 'Профилът е суспендиран',
        fraudAttempt: 'Fraud опит',
      },
      noResults: 'Няма резултати',
      noDisputes: 'Няма отворени спорове',
    },
  },

  en: {
    nav: {
      home: 'Home', masters: 'Masters', howItWorks: 'How it works',
      login: 'Login', register: 'Register', logout: 'Logout', dashboard: 'Dashboard',
    },
    footer: {
      description: 'Digital platform connecting property owners with verified specialists.',
      services: 'Services', forMasters: 'For Masters', company: 'AnyFix',
      copyright: '© 2026 AnyFix. All rights reserved.',
      terms: 'Terms', privacy: 'Privacy', cookies: 'Cookies',
      links: {
        services: [['Plumbing','/c/vik'],['Electrical','/c/electric'],['Painting','/c/painting'],['Masonry','/c/masonry']],
        forMasters: [['Register','/register?role=MASTER'],['AnyFix Levels','/levels'],['Verification','/verify']],
        company: [['About','/about'],['Blog','/blog'],['Support','/support'],['Terms','/terms'],['Privacy','/privacy']],
      },
    },
    common: {
      loading: 'Loading...', error: 'Error', cancel: 'Cancel',
      save: 'Save', send: 'Send', confirm: 'Confirm',
      noResults: 'No results', currency: '€',
    },
    status: {
      DRAFT: 'Draft', PUBLISHED: 'Published', OFFERS_RECEIVED: 'Offers Received',
      ACCEPTED: 'Accepted', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed',
      DISPUTED: 'Disputed', CANCELLED: 'Cancelled',
    },
    categories: {
      ELECTRIC: '⚡ Electrical', VIK: '🔧 Plumbing', PAINTING: '🎨 Painting',
      MASONRY: '🧱 Masonry', TILES: '🏗️ Tiles', JOINERY: '🪟 Joinery',
      FLOORING: '🪵 Flooring', HANDYMAN: '🔨 Handyman',
    },
    urgency: {
      URGENT: '🚨 Urgent (24h)', WITHIN_3_DAYS: '📅 Within 3 days', FLEXIBLE: '🗓️ Flexible',
    },
    login: {
      subtitle: 'Sign in to your account',
      email: 'Email address', password: 'Password',
      forgotPassword: 'Forgot password?',
      submit: 'Sign in →', submitting: 'Signing in...',
      noAccount: "Don't have an account?", registerLink: 'Sign up',
      success: 'Welcome!', error: 'Invalid email or password',
    },
    register: {
      title: 'Create account', subtitle: 'Free. No card required.',
      clientLabel: 'Client', masterLabel: 'Master',
      clientDesc: 'Looking for a master', masterDesc: 'Offering services',
      firstName: 'First name', lastName: 'Last name',
      email: 'Email', phone: 'Phone (+359XXXXXXXXX)', password: 'Password',
      terms: 'I accept the', termsLink: 'Terms of Service', and: 'and', privacyLink: 'Privacy Policy',
      submit: 'Create account →', submitting: 'Registering...',
      hasAccount: 'Already have an account?', loginLink: 'Sign in',
      success: 'Registration successful! Check your email.', error: 'Registration error',
    },
    clientDash: {
      welcome: 'Welcome,', subtitle: 'Manage your repair orders',
      newOrder: '➕ New Request',
      stats: {
        active: 'Active Orders', activesSub: 'right now',
        pending: 'Awaiting Decision', pendingSub: 'new offers',
        completed: 'Completed', completedSub: 'successfully',
        spent: 'Total Spent', spentSub: 'overall',
      },
      alert: { title: 'You have', orders: 'order(s) with new offers!', sub: 'Review the offers and choose a master.', btn: 'Review' },
      tabs: { active: 'Active', completed: 'Completed', disputes: 'Disputes' },
      empty: 'No orders in this category',
      createFirst: 'Create your first request',
      offers: 'offers', loadError: 'Error loading orders',
    },
    newOrder: {
      title: '🔧 New Repair Request',
      category: 'Category', titleField: 'Title',
      titleHint: '(min. 10 characters)',
      description: 'Description', descHint: '(min. 30 characters)',
      descPlaceholder: 'Describe in detail what needs to be done, dimensions, specifics...',
      titlePlaceholder: 'e.g. Bathroom plumbing replacement',
      city: 'City', urgency: 'Urgency',
      budget: 'Approximate budget (€)', budgetOptional: '– optional',
      budgetPlaceholder: 'e.g. 800',
      info: 'Verified masters in your area will be notified and will send offers within 4 hours.',
      infoLabel: 'ℹ️ Next steps:',
      submit: '📢 Publish Request →', submitting: 'Publishing...',
      errorFields: 'Please fill in all fields',
      errorDesc: 'Description must be at least 30 characters',
      success: 'Order published! Masters will be notified.',
      createError: 'Error creating order',
      cities: ['Sofia','Varna','Plovdiv','Burgas','Stara Zagora','Ruse','Pleven'],
    },
    orderDetail: {
      breadcrumb: 'Dashboard',
      upTo: 'Up to',
      payEscrow: '🔒 Pay via escrow →', payLoading: 'Loading...',
      confirmComplete: '✅ Confirm completion',
      openDispute: '⚠️ Open dispute',
      confirmMsg: 'Confirm that the work is completed and you are satisfied. Escrow will be released.',
      disputePrompt: 'Describe the problem:',
      escrowHeld: 'are in escrow – will be released after your confirmation.',
      offerAccepted: 'Offer accepted! Proceed to payment.',
      orderCompleted: 'Order completed! Funds released to master.',
      disputeOpened: 'Dispute opened. AnyFix will review within 3 business days.',
      notFound: 'Order not found',
      tabs: { offers: 'Offers', chat: 'Chat 💬', photos: 'Photos 📸' },
      waitingOffers: 'Waiting for offers from masters...',
      acceptOffer: '✅ Accept this offer',
      acceptedOffer: '✓ ACCEPTED OFFER',
      orders: 'orders',
      chatEmpty: 'Chat is active after accepting an offer',
      chatPlaceholder: 'Write a message... (Enter to send)',
      chatWarning: '🔒 Phones and emails in chat are prohibited. Payments only through AnyFix.',
      chatFraud: '⚠️ Personal contacts are not allowed in chat. Payments only through AnyFix.',
      photoBefore: '📸 Before work', photoAfter: '✅ After work', photoProgress: '📷 Progress',
      photoUploaded: 'Photo uploaded!', photoError: 'Upload error',
      selectedMaster: '🔧 Selected Master',
      amount: 'Amount', escrowStatus: 'Escrow status',
      held: '🔒 Held', released: '✅ Released', pending: '⏳ Pending',
      leaveReview: '⭐ Leave a review',
      reviewHelps: 'Your review helps other clients.',
      leaveReviewBtn: 'Leave a review',
      estimatedHours: 'h',
    },
    payment: {
      title: 'Secure Payment',
      subtitle: 'Escrow protection – pay only for completed work',
      summary: '📋 Order Summary',
      platformFee: 'Platform fee', feeIncluded: 'Included',
      total: 'Total (in escrow)',
      payBtn: '🔒 Pay €{amount} in escrow',
      processing: 'Processing...',
      escrowInfo: 'Funds are held securely and released to the master only after your confirmation that the work is completed.',
      escrowTitle: 'Escrow protection:',
      success: 'Payment successful!', successSub: 'Funds are in escrow. Redirecting...',
      loadingPayment: 'Loading payment...', loadingForm: 'Loading form...',
      stripe: '🔒 Protected by Stripe · Your data is encrypted · PCI DSS Level 1',
    },
    masterDash: {
      hello: 'Hello,', emoji: '🔧',
      completedOrders: 'orders',
      thisWeek: 'This week',
      tabs: { available: 'Available Requests', mine: 'My Orders' },
      noAvailable: 'No available requests right now',
      noMine: 'No active orders',
      offerBtn: 'Offer',
      verifyTitle: 'Verification Progress',
      verifySub: 'Complete verification to receive orders',
      verifyContinue: 'Continue verification →',
      verifySteps: ['Registration','Documents','Review','Interview','Approved ✅'],
      profileBtn: '✏️ Profile', stripeBtn: '💳 Connect Stripe',
      offerModal: {
        title: 'Send Offer',
        priceLabel: 'Price (€) *', hoursLabel: 'Hours (approx.)',
        descLabel: 'Offer description *',
        descPlaceholder: 'Describe how you will complete the job, materials, warranty...',
        pricePlaceholder: 'e.g. 350', hoursPlaceholder: 'e.g. 4',
        yourEarnings: 'Your earnings:', afterFee: '(after 14% commission)',
        submit: '📤 Send Offer', submitting: 'Sending...',
        sent: 'Offer sent!', error: 'Error sending offer',
        fillFields: 'Please fill in all fields',
      },
      stats: { active: 'Active Orders', response: 'Avg. Response', rating: 'Rating' },
      nextLevel: '🏆 To next level',
      loadError: 'Error loading data',
      urgency: { URGENT: '🚨 Urgent', WITHIN_3_DAYS: '📅 Within 3 days', FLEXIBLE: '🗓️ Flexible' },
      upTo: 'Up to',
    },
    admin: {
      title: '🛡️ AnyFix Admin',
      subtitle: 'Platform Management',
      kpi: {
        users: 'Total Users', masters: 'Active Masters',
        pending: 'Pending Verification', revenue: 'Revenue (€)',
        activeOrders: 'Active Orders', disputes: 'Open Disputes',
        fraud: 'Fraud Signals', totalOrders: 'Total Orders',
      },
      tabs: { overview: '📊 Overview', masters: '🔧 Masters', disputes: '⚠️ Disputes', fraud: '🚨 Fraud' },
      overview: { title: 'Actions requiring attention' },
      masters: { searchPlaceholder: '🔍 Search by name or email...', allStatuses: 'All statuses' },
      verStatus: {
        PENDING: 'Pending', DOCUMENTS_SUBMITTED: 'Documents submitted',
        UNDER_REVIEW: 'Under review', INTERVIEW_SCHEDULED: 'Interview scheduled',
        APPROVED: 'Approved', REJECTED: 'Rejected',
      },
      masterRow: {
        documents: 'documents',
        approve: '✅ Approve', interview: '📅 Interview', reject: '❌ Reject',
        rejectPrompt: 'Reason for rejection:',
        approvedMsg: (a: string) => `Master ${a === 'APPROVE' ? 'approved' : a === 'REJECT' ? 'rejected' : 'scheduled for interview'}`,
      },
      disputeRow: {
        client: 'Client', amount: 'Amount',
        reason: 'Reason:', decisionPrompt: 'Decision:',
        refundClient: 'Refund to client', releaseMaster: 'Release to master',
        resolved: 'Dispute resolved',
      },
      fraud: {
        warning: '🚨 The following users have been detected attempting offline negotiations. Review the messages and take action.',
        none: 'No fraud signals',
        detected: 'Detected:', score: 'Score:',
        suspend: 'Suspend', suspended: 'Profile suspended',
        fraudAttempt: 'Fraud attempt',
      },
      noResults: 'No results',
      noDisputes: 'No open disputes',
    },
  },
} as const;

export type Translations = typeof translations.bg;

// ─── Context ───────────────────────────────────────────────
const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}>({ lang:'bg', setLang:()=>{}, t: translations.bg });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('bg');
  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useT() {
  return useContext(LangContext);
}
