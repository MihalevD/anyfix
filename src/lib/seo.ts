// AnyFix – src/lib/seo.ts
// Централизирано SEO и Schema.org structured data

import type { Metadata } from 'next';

const BASE = {
  url:         'https://anyfix.bg',
  name:        'AnyFix',
  description: 'Find a verified master for repair and maintenance. Offers within 4 hours. Secure escrow payment.',
  logo:        'https://anyfix.bg/logo.png',
  twitterHandle: '@anyfix_bg',
};

// ─── Page metadata factory ────────────────────────────────

export function pageMetadata(opts: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const title  = opts.title ? `${opts.title} | AnyFix` : 'AnyFix – Verified Masters for Your Home';
  const desc   = opts.description || BASE.description;
  const url    = `${BASE.url}${opts.path || ''}`;
  const image  = opts.image || `${BASE.url}/og-default.jpg`;

  return {
    title,
    description: desc,
    metadataBase: new URL(BASE.url),
    alternates: { canonical: url },
    robots: opts.noIndex ? 'noindex,nofollow' : 'index,follow',
    openGraph: {
      title, description: desc, url, type: 'website', siteName: BASE.name,
      images: [{ url:image, width:1200, height:630, alt:title }],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image', title, description: desc,
      images: [image], site: BASE.twitterHandle,
    },
    other: {
      'google-site-verification': process.env.GOOGLE_SITE_VERIFICATION || '',
    },
  };
}

// ─── Schema.org LocalBusiness ─────────────────────────────

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'AnyFix',
    description: BASE.description,
    url: BASE.url,
    logo: BASE.logo,
    sameAs: ['https://www.facebook.com/anyfix.bg', 'https://www.instagram.com/anyfix.bg'],
    contactPoint: { '@type':'ContactPoint', contactType:'customer service', email:'support@anyfix.bg', availableLanguage:'Bulgarian' },
    areaServed: ['София','Варна','Пловдив','Бургас','Стара Загора'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Ремонтни услуги',
      itemListElement: [
        { '@type':'Offer', itemOffered: { '@type':'Service', name:'Електро услуги' } },
        { '@type':'Offer', itemOffered: { '@type':'Service', name:'ВиК ремонти' } },
        { '@type':'Offer', itemOffered: { '@type':'Service', name:'Боядисване' } },
        { '@type':'Offer', itemOffered: { '@type':'Service', name:'Зидария и шпакловки' } },
      ],
    },
  };
}

// ─── Schema.org for Master Profile ───────────────────────

export function masterProfileSchema(master: {
  id: string; firstName: string; lastName: string;
  city: string; categories: string[]; rating: number; reviewCount: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: `${master.firstName} ${master.lastName}`,
    jobTitle: master.categories.join(', '),
    url: `${BASE.url}/masters/${master.id}`,
    worksFor: { '@type':'Organization', name:'AnyFix' },
    address: { '@type':'PostalAddress', addressLocality:master.city, addressCountry:'BG' },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: master.rating,
      reviewCount: master.reviewCount,
      bestRating: 5, worstRating: 1,
    },
  };
}

// ─── Schema.org for Service/Category pages ───────────────

export function servicePageSchema(category: string, city: string) {
  const catNames: Record<string, string> = {
    electric:'Електро услуги', vik:'ВиК ремонти', painting:'Боядисване',
    masonry:'Зидария и шпакловки', tiles:'Плочки и теракот',
    joinery:'Дограма', flooring:'Паркет и настилки', handyman:'Handyman услуги',
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${catNames[category] || category} в ${city}`,
    description: `Намери верифициран ${catNames[category] || category} специалист в ${city} чрез AnyFix.`,
    provider: { '@type':'Organization', name:'AnyFix', url:BASE.url },
    areaServed: { '@type':'City', name:city },
    url: `${BASE.url}/${category}-${city.toLowerCase()}`,
  };
}

// ─── FAQ Schema ───────────────────────────────────────────

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type':'Question', name:'Как намирам верифициран майстор в AnyFix?', acceptedAnswer: { '@type':'Answer', text:'Публикувай заявка с описание на ремонта. Верифицираните майстори в твоя район ще изпратят оферти до 4 часа.' } },
    { '@type':'Question', name:'Как работи ескроу плащането?', acceptedAnswer: { '@type':'Answer', text:'Плащаш чрез AnyFix и парите се задържат сигурно. Освобождават се към майстора само след твоето потвърждение за завършена работа.' } },
    { '@type':'Question', name:'Колко струва регистрацията в AnyFix?', acceptedAnswer: { '@type':'Answer', text:'Регистрацията е напълно безплатна за клиентите. AnyFix удържа комисионна само при успешно завършена поръчка.' } },
    { '@type':'Question', name:'Как са верифицирани майсторите?', acceptedAnswer: { '@type':'Answer', text:'Всеки майстор преминава 7-стъпкова верификация: лична карта, свидетелство за съдимост, дипломи, портфолио, онлайн тест и видео интервю.' } },
  ],
};

// ─── Inject schema as script tag ─────────────────────────

export function SchemaScript({ schema }: { schema: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
