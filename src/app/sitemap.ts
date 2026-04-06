// AnyFix – src/app/sitemap.ts (Next.js 14 App Router)
// Автоматично генерира sitemap.xml

import { MetadataRoute } from 'next';
import { prisma } from '@/lib/server/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://anyfix.bg';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                   lastModified: new Date(), changeFrequency:'daily',   priority:1 },
    { url:`${baseUrl}/masters`,       lastModified: new Date(), changeFrequency:'daily',   priority:0.9 },
    { url:`${baseUrl}/how-it-works`,  lastModified: new Date(), changeFrequency:'monthly', priority:0.7 },
    { url:`${baseUrl}/register`,      lastModified: new Date(), changeFrequency:'monthly', priority:0.8 },
    { url:`${baseUrl}/login`,         lastModified: new Date(), changeFrequency:'monthly', priority:0.6 },
    { url:`${baseUrl}/privacy`,       lastModified: new Date(), changeFrequency:'yearly',  priority:0.3 },
    { url:`${baseUrl}/terms`,         lastModified: new Date(), changeFrequency:'yearly',  priority:0.3 },
    // Category pages
    ...['electric','vik','painting','masonry','tiles','joinery','flooring','handyman'].map(cat => ({
      url: `${baseUrl}/c/${cat}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
    // City + category combinations (SEO gold)
    ...['sofia','varna','plovdiv','burgas'].flatMap(city =>
      ['electric','vik','painting','masonry'].map(cat => ({
        url: `${baseUrl}/${cat}-${city}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    ),
  ];

  // Dynamic master profile pages
  let masterPages: MetadataRoute.Sitemap = [];
  try {
    const masters = await prisma.masterProfile.findMany({
      where: { verificationStatus:'APPROVED' },
      select: { id:true, updatedAt:true },
      take: 500,
    });
    masterPages = masters.map(m => ({
      url: `${baseUrl}/masters/${m.id}`,
      lastModified: m.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {}

  return [...staticPages, ...masterPages];
}

// ─── robots.txt ───────────────────────────────────────────
// src/app/robots.ts
export function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/', '/api/', '/verify/'],
    },
    sitemap: 'https://anyfix.bg/sitemap.xml',
  };
}
