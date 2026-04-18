/**
 * SEO Optimization Utilities
 * Provides meta tags, structured data, and sitemap generation
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for page-level optimization
 */
export const SEO = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  author = 'PrepLoop',
  publishedTime,
  modifiedTime,
  structuredData,
}) => {
  const siteUrl = 'https://preploop.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const imageUrl = image ? `${siteUrl}${image}` : `${siteUrl}/og-image.png`;

  const defaultTitle = 'PrepLoop - Master Technical Interviews';
  const defaultDescription = 'Comprehensive interview preparation platform with DSA practice, AI coaching, system design, and real-time job matching.';

  const fullTitle = title ? `${title} | PrepLoop` : defaultTitle;
  const metaDescription = description || defaultDescription;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="PrepLoop" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content="@preploop" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

/**
 * Generate structured data for different page types
 */
export const generateStructuredData = {
  website: () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PrepLoop',
    url: 'https://preploop.com',
    description: 'Comprehensive interview preparation platform',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://preploop.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }),

  course: (course) => ({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: 'PrepLoop',
      sameAs: 'https://preploop.com',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: course.duration,
    },
  }),

  article: (article) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'PrepLoop',
      logo: {
        '@type': 'ImageObject',
        url: 'https://preploop.com/logo.png',
      },
    },
  }),

  jobPosting: (job) => ({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.postedAt,
    validThrough: job.expiresAt,
    employmentType: job.type,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
    },
    baseSalary: job.salary && {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        value: job.salary,
        unitText: 'YEAR',
      },
    },
  }),

  breadcrumb: (items) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://preploop.com${item.url}`,
    })),
  }),

  faq: (faqs) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }),
};

/**
 * Sitemap generator
 */
export class SitemapGenerator {
  constructor() {
    this.urls = [];
  }

  addUrl(url, options = {}) {
    this.urls.push({
      loc: url,
      lastmod: options.lastmod || new Date().toISOString().split('T')[0],
      changefreq: options.changefreq || 'weekly',
      priority: options.priority || 0.5,
    });
  }

  generate() {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${this.urls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return xml;
  }

  static generateForPrepLoop() {
    const generator = new SitemapGenerator();
    const baseUrl = 'https://preploop.com';

    // Static pages
    generator.addUrl(`${baseUrl}/`, { priority: 1.0, changefreq: 'daily' });
    generator.addUrl(`${baseUrl}/about`, { priority: 0.8 });
    generator.addUrl(`${baseUrl}/pricing`, { priority: 0.9 });
    generator.addUrl(`${baseUrl}/blog`, { priority: 0.8, changefreq: 'daily' });
    generator.addUrl(`${baseUrl}/contact`, { priority: 0.7 });

    // Practice pages
    generator.addUrl(`${baseUrl}/practice/dsa`, { priority: 0.9, changefreq: 'daily' });
    generator.addUrl(`${baseUrl}/practice/system-design`, { priority: 0.9 });
    generator.addUrl(`${baseUrl}/practice/interview`, { priority: 0.9 });

    // Job pages
    generator.addUrl(`${baseUrl}/jobs`, { priority: 0.9, changefreq: 'hourly' });
    generator.addUrl(`${baseUrl}/jobs/recommendations`, { priority: 0.8 });

    return generator.generate();
  }
}

/**
 * Robots.txt generator
 */
export const generateRobotsTxt = () => {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/

Sitemap: https://preploop.com/sitemap.xml
`;
};

export default {
  SEO,
  generateStructuredData,
  SitemapGenerator,
  generateRobotsTxt,
};
