export function validateCustomUrl(slug) {
  const value = String(slug || '').trim().toLowerCase();
  if (!value) return { valid: false, reason: 'empty' };
  if (!/^[a-z0-9-]{3,30}$/.test(value)) return { valid: false, reason: 'format' };

  const RESERVED_SLUGS = new Set([
    'admin', 'api', 'dashboard', 'settings', 'profile', 'login', 'signup',
    'auth', 'u', 'pricing', 'about', 'contact', 'help', 'terms', 'privacy',
    'overview', 'wallet', 'history', 'community', 'explore', 'problems', 'blog'
  ]);
  if (RESERVED_SLUGS.has(value)) {
    return { valid: false, reason: 'reserved' };
  }

  return { valid: true, value };
}

export function buildAvatarPath(userId, originalName) {
  const extMatch = String(originalName || '').match(/(\.[^.]*)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : '.jpg';
  const ts = Date.now();
  return `avatars/${userId}_${ts}${ext}`;
}

export async function claimCustomUrl(supabaseAdmin, userId, requested) {
  const { valid, value, reason } = validateCustomUrl(requested);
  if (!valid) return { success: false, error: reason };

  // Check existing
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('custom_url', value)
    .limit(1);

  if (existingError) throw existingError;
  if (Array.isArray(existing) && existing.length > 0) {
    const takenBy = existing[0]?.id;
    if (takenBy && takenBy !== userId) {
      return { success: false, error: 'taken' };
    }
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ custom_url: value, is_public: true, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (updateError) throw updateError;

  let profileRow = updated;
  if (!profileRow) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, custom_url: value, is_public: true, updated_at: new Date().toISOString() })
      .select()
      .maybeSingle();
    if (insertError) throw insertError;
    profileRow = inserted;
  }

  return { success: true, profile: profileRow || null };
}

