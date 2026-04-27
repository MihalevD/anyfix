// AnyFix – src/app/sitemap.ts (Next.js 14 App Router)

import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://anyfix.bg';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                   lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${baseUrl}/masters`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/register`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/login`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms`,        lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ...['electric','vik','painting','masonry','tiles','joinery','flooring','handyman'].map((cat) => ({
      url: `${baseUrl}/masters?category=${cat.toUpperCase()}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
  ];

  // Dynamic master pages would normally come from an API call here; skipped for v1
  // to keep the build hermetic and not require backend connectivity at build time.

  return staticPages;
}
