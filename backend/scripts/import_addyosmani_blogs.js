import { supabaseAdmin } from '../db/supabaseClient.js';

const BASE_URL = 'https://addyosmani.com';

const HTML_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&rdquo;': '”',
  '&ldquo;': '“',
  '&hellip;': '…',
};

function decodeEntities(str = '') {
  return String(str)
    .replace(/&(?:amp|lt|gt|quot|#39|#x27|apos|nbsp|mdash|ndash|rsquo|lsquo|rdquo|ldquo|hellip);/g, (m) => HTML_ENTITIES[m] || m)
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

function stripTags(html = '') {
  return decodeEntities(String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return BASE_URL + url;
  return `${BASE_URL}/${url}`;
}

function parseDateToIso(dateStr) {
  if (!dateStr) return new Date().toISOString();
  const cleaned = decodeEntities(dateStr).replace(/\s+/g, ' ').trim();
  const parsed = Date.parse(cleaned + ' UTC');
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  const fallback = Date.parse(cleaned);
  if (!Number.isNaN(fallback)) return new Date(fallback).toISOString();
  return new Date().toISOString();
}

function categorizePost(title = '', slug = '', text = '') {
  const haystack = `${title} ${slug} ${text.slice(0, 800)}`.toLowerCase();

  if (/\b(ai|agent|agentic|llm|copilot|prompt|gpt|claude|gemini|model|vibe coding|mcp|skill decay|harness|outer loop|software factor)/i.test(haystack)) {
    return 'AI/ML';
  }
  if (/\b(perf|performance|lighthouse|core web vitals|lcp|cls|fid|inp|bundle|lazy[- ]?load|prpl|loading|render|cache|caching|speed|preload|prefetch|paint|hydration|rehydration|bfcache|profiling|memory leak|devtools timeline|flame)/i.test(haystack)) {
    return 'Web Performance';
  }
  if (/\b(career|leadership|leader|manager|management|engineering team|mentor|interview|communication|empathy|burnout|productivity|habits|10 years|review|taste|judgment|learning)/i.test(haystack)) {
    return 'Career';
  }
  if (/\b(architect|architecture|system|scale|scalable|design pattern|publish\/subscribe|pubsub|micro[- ]?frontend|service worker|pwa|progressive web app|offline|state management|mvc|mvvm|modular|dependency injection)/i.test(haystack)) {
    return 'System Design';
  }
  return 'Frontend & JS';
}

function sanitizePostHtml(rawHtml) {
  let html = String(rawHtml || '');

  // Remove dangerous tags
  html = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '$1="#"');

  // Resolve relative src/href attributes to addyosmani.com
  html = html.replace(/\b(src|href)\s*=\s*"(\/[^"]*)"/gi, (_, attr, path) => `${attr}="${BASE_URL}${path}"`);
  html = html.replace(/\b(src|href)\s*=\s*'(\/[^']*)'/gi, (_, attr, path) => `${attr}='${BASE_URL}${path}'`);

  // Strip lazy loading placeholder clutter if needed, keep clean img attributes
  return html.trim();
}

function extractPostBody(html) {
  const startMatch = html.match(/<section[^>]*id=["']post-body["'][^>]*>/i);
  if (!startMatch) return null;
  const startIdx = startMatch.index + startMatch[0].length;
  const articleEndIdx = html.indexOf('</article>', startIdx);
  const slice = articleEndIdx !== -1 ? html.slice(startIdx, articleEndIdx) : html.slice(startIdx);
  const lastSectionIdx = slice.lastIndexOf('</section>');
  return lastSectionIdx !== -1 ? slice.slice(0, lastSectionIdx) : slice;
}

async function collectCatalog() {
  const catalog = new Map();

  for (let p = 1; p <= 25; p++) {
    const pageUrl = p === 1 ? `${BASE_URL}/blog/` : `${BASE_URL}/blog/page${p}/`;
    const res = await fetch(pageUrl);
    if (!res.ok) break;
    const html = await res.text();

    const cards = [...html.matchAll(/<article class="card">([\s\S]*?)<\/article>/g)];
    if (cards.length === 0) break;

    for (const [, cardHtml] of cards) {
      const href = cardHtml.match(/<h3[^>]*class="card-title"[^>]*>\s*<a[^>]+href="([^"]+)"/i)?.[1]
        || cardHtml.match(/<a[^>]+href="(\/blog\/[^"]+)"/i)?.[1];
      if (!href || !href.startsWith('/blog/') || /^\/blog\/(page\d+\/?)?$/.test(href)) continue;

      const fullUrl = BASE_URL + href;
      const slug = href.replace(/^\/blog\//, '').replace(/\/+$/, '');
      const title = stripTags(cardHtml.match(/<h3[^>]*class="card-title"[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || '');
      const dateText = stripTags(cardHtml.match(/<time[^>]*class="card-date"[^>]*>([\s\S]*?)<\/time>/i)?.[1] || '');
      const description = stripTags(cardHtml.match(/<p[^>]*class="card-description"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
      const img = cardHtml.match(/<img[^>]+src="([^"]+)"/i)?.[1] || null;

      if (!catalog.has(slug)) {
        catalog.set(slug, {
          url: fullUrl,
          slug,
          title,
          dateText,
          description,
          coverImage: resolveUrl(img),
        });
      }
    }
  }

  // Also check sitemap.xml for any blog posts omitted from pagination (e.g. software-eng-10-years)
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  if (sitemapRes.ok) {
    const sitemap = await sitemapRes.text();
    for (const [, loc] of sitemap.matchAll(/<loc>(https:\/\/addyosmani\.com\/blog\/[^<]+)<\/loc>/g)) {
      if (/\/blog\/(page\d+\/?|good-code\/?)$/.test(loc)) continue;
      const slug = loc.replace(`${BASE_URL}/blog/`, '').replace(/\/+$/, '');
      if (slug && !catalog.has(slug)) {
        catalog.set(slug, {
          url: loc,
          slug,
          title: '',
          dateText: '',
          description: '',
          coverImage: null,
        });
      }
    }
  }

  return [...catalog.values()];
}

async function fetchAndParsePost(entry) {
  const res = await fetch(entry.url, { redirect: 'manual' });

  // Handle external redirects (e.g. patterns.dev / patterns.addy.ie)
  if (res.status >= 300 && res.status < 400) {
    const targetUrl = res.headers.get('location') || entry.url;
    const title = entry.title || entry.slug.replace(/-/g, ' ');
    const summary = entry.description || `Read "${title}" by Addy Osmani.`;
    const content = [
      `<p>${summary}</p>`,
      `<p>This article was originally published on Addy Osmani's blog and is now hosted externally at <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${targetUrl}</a>.</p>`,
      `<hr />`,
      `<p><em>Originally published by <a href="${entry.url}" target="_blank" rel="noopener noreferrer">Addy Osmani</a>.</em></p>`,
    ].join('\n');

    return {
      title: title.slice(0, 200),
      slug: entry.slug,
      content,
      author_id: null,
      category: categorizePost(title, entry.slug, summary),
      cover_image: entry.coverImage,
      read_time: 5,
      is_published: true,
      created_at: parseDateToIso(entry.dateText),
      updated_at: parseDateToIso(entry.dateText),
    };
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${entry.url}`);
  }

  const html = await res.text();
  const h1 = stripTags(html.match(/<article[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  const ogTitle = decodeEntities(html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] || '').replace(/\s*\|\s*AddyOsmani\.com\s*$/i, '').trim();
  const title = (h1 || entry.title || ogTitle || entry.slug).trim();

  const headlineDate = stripTags(html.match(/<h2[^>]*class="headline"[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || '');
  const jsonLdDate = html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] || '';
  const createdAt = parseDateToIso(headlineDate || entry.dateText || jsonLdDate);

  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] || null;
  let coverImage = entry.coverImage;
  if (!coverImage && ogImage && !ogImage.includes('grain-gradient.png')) {
    coverImage = resolveUrl(ogImage);
  }

  const rawBody = extractPostBody(html);
  if (!rawBody) {
    throw new Error(`No #post-body found for ${entry.url}`);
  }

  const cleanedBody = sanitizePostHtml(rawBody);
  const attribution = `\n<hr />\n<p><em>Originally published by <a href="${entry.url}" target="_blank" rel="noopener noreferrer">Addy Osmani</a>.</em></p>`;
  const content = cleanedBody + attribution;

  const plainText = stripTags(cleanedBody);
  const wordCount = plainText ? plainText.split(/\s+/).length : 300;
  const readTime = Math.max(2, Math.round(wordCount / 220));

  return {
    title: title.slice(0, 250),
    slug: entry.slug,
    content,
    author_id: null,
    category: categorizePost(title, entry.slug, plainText),
    cover_image: coverImage,
    read_time: readTime,
    is_published: true,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

async function main() {
  console.log('Discovering all blog posts from https://addyosmani.com/blog/ ...');
  const entries = await collectCatalog();
  console.log(`Found ${entries.length} unique blog entries.`);

  const parsedPosts = [];
  const failures = [];
  const BATCH_SIZE = 15;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((e) => fetchAndParsePost(e)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        parsedPosts.push(r.value);
      } else {
        failures.push({ url: batch[idx].url, error: r.reason?.message || String(r.reason) });
      }
    });
    if ((i + BATCH_SIZE) % 60 === 0 || i + BATCH_SIZE >= entries.length) {
      console.log(`Fetched ${Math.min(i + BATCH_SIZE, entries.length)}/${entries.length} posts (${parsedPosts.length} ok, ${failures.length} failed)...`);
    }
  }

  if (failures.length > 0) {
    console.warn('Failures:', failures);
  }

  // Upsert into Supabase blogs table by slug
  const UPSERT_BATCH = 25;
  let upserted = 0;
  for (let i = 0; i < parsedPosts.length; i += UPSERT_BATCH) {
    const chunk = parsedPosts.slice(i, i + UPSERT_BATCH);
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .upsert(chunk, { onConflict: 'slug' })
      .select('id');

    if (error) {
      throw new Error(`Supabase upsert error at batch ${i}: ${error.message}`);
    }
    upserted += data?.length || chunk.length;
  }

  const categoryCounts = parsedPosts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  console.log(`Successfully upserted ${upserted} Addy Osmani blog posts into Supabase.`);
  console.log('Category breakdown:', categoryCounts);
  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
