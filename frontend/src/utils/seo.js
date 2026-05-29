/**
 * SEO Optimization Utilities
 * Provides structured data and sitemap generation
 *
 * NOTE: The page-level SEO component (using react-helmet-async) was removed
 * because the package is not installed and no component imported it.
 * If you need per-page <head> management, install react-helmet-async and
 * restore the SEO component.
 */

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
  generateStructuredData,
  SitemapGenerator,
  generateRobotsTxt,
};
