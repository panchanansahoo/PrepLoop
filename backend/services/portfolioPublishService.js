import { supabaseAdmin } from '../db/supabaseClient.js';
import { renderPortfolioHtml } from './portfolioRendererService.js';

export const createPortfolioSite = async ({ userId, profileId, slug, template = 'minimal', theme = {} }) => {
  const { data: profileRow, error: profileError } = await supabaseAdmin
    .from('normalized_profiles')
    .select('*')
    .eq('id', profileId)
    .eq('user_id', userId)
    .single();

  if (profileError || !profileRow) {
    throw new Error('Profile not found');
  }

  const profile = {
    basicInfo: profileRow.basic_info || {},
    socials: profileRow.socials || {},
    skills: profileRow.skills || {},
    experience: profileRow.experience || [],
    projects: profileRow.projects || [],
  };

  const html = renderPortfolioHtml({ profile, template, theme });

  const { data: site, error: insertError } = await supabaseAdmin
    .from('portfolio_sites')
    .insert({
      user_id: userId,
      profile_id: profileId,
      slug,
      template,
      theme,
      html_content: html,
      published: true,
      published_at: new Date().toISOString(),
      visibility: 'public',
    })
    .select('*')
    .single();

  if (insertError || !site) {
    throw new Error(insertError?.message || 'Failed to create portfolio site');
  }

  return site;
};

export const unpublishPortfolioSite = async ({ userId, siteId }) => {
  const { error } = await supabaseAdmin
    .from('portfolio_sites')
    .update({ published: false, updated_at: new Date().toISOString() })
    .eq('id', siteId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message || 'Failed to unpublish portfolio site');
  }
};

export default {
  createPortfolioSite,
  unpublishPortfolioSite,
};
