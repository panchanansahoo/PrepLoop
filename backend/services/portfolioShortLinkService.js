import { randomBytes } from 'crypto';
import { supabaseAdmin } from '../db/supabaseClient.js';

const BASE_SHORT_DOMAIN = process.env.PORTFOLIO_SHORT_DOMAIN || 'https://link.preploop.com';

const sanitizeSlug = (input) =>
  String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const generateRandomSlug = (length = 8) => {
  const raw = randomBytes(length).toString('base64url').toLowerCase();
  return sanitizeSlug(raw).slice(0, length);
};

export const ensureSlugAvailable = async (table, slug) => {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('id')
    .eq('slug', slug)
    .limit(1);

  if (error) {
    throw new Error(error.message || `Failed to validate slug in ${table}`);
  }

  return !Array.isArray(data) || data.length === 0;
};

export const reservePortfolioSlug = async (preferredSlug) => {
  const normalized = sanitizeSlug(preferredSlug);
  const base = normalized || generateRandomSlug(10);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slugCandidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const available = await ensureSlugAvailable('portfolio_sites', slugCandidate);
    if (available) {
      return slugCandidate;
    }
  }

  return `${base}-${Date.now()}`;
};

export const createShortLink = async ({ portfolioSiteId, fullUrl, preferredSlug = null }) => {
  const base = preferredSlug ? sanitizeSlug(preferredSlug) : generateRandomSlug(7);

  let slug = base;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const available = await ensureSlugAvailable('short_links', slug);
    if (available) break;
    slug = `${base}${attempt + 1}`;
  }

  const { data, error } = await supabaseAdmin
    .from('short_links')
    .insert({
      portfolio_site_id: portfolioSiteId,
      slug,
      full_url: fullUrl,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create short link');
  }

  return {
    ...data,
    short_url: `${BASE_SHORT_DOMAIN}/${slug}`,
  };
};

export const resolveShortLink = async (slug) => {
  const { data, error } = await supabaseAdmin
    .from('short_links')
    .select('full_url')
    .eq('slug', sanitizeSlug(slug))
    .single();

  if (error || !data) {
    return null;
  }

  return data.full_url;
};

export default {
  reservePortfolioSlug,
  createShortLink,
  resolveShortLink,
};
