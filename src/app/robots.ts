import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
      disallow: '/admin/',
      disallow: '/login',
    },
    sitemap: 'https://spikeball.ddns.net/sitemap.xml',
  }
}
