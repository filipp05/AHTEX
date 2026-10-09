import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) return []
  return ['', '/production/', '/catalog/', '/documents/', '/contacts/', '/privacy/'].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }))
}
