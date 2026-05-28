const normalizeProfileUpdatePayload = (body = {}) => {
  const updates = {};

  const fullNameRaw = body.fullName || body.full_name;
  const experienceLevelRaw = body.experienceLevel || body.experience_level;
  const currentRoleRaw = body.currentRole || body.current_role || body.designation;
  const bioRaw = body.bio;
  const skillsRaw = body.skills;
  const educationRaw = body.education;
  const qualificationRaw = body.qualification;

  if (fullNameRaw !== undefined) {
    const trimmed = String(fullNameRaw || '').trim();
    if (trimmed !== '') updates.full_name = trimmed;
  }
  if (experienceLevelRaw !== undefined) {
    const trimmed = String(experienceLevelRaw || '').trim();
    if (trimmed !== '') updates.experience_level = trimmed;
  }
  if (currentRoleRaw !== undefined) {
    const trimmed = String(currentRoleRaw || '').trim();
    if (trimmed !== '') updates.designation = trimmed;
  }
  if (bioRaw !== undefined) {
    updates.bio = typeof bioRaw === 'string' ? bioRaw.trim() : bioRaw;
  }
  if (skillsRaw !== undefined) {
    updates.skills = typeof skillsRaw === 'string' ? skillsRaw.trim() : skillsRaw;
  }
  if (educationRaw !== undefined) {
    updates.education = typeof educationRaw === 'string' ? educationRaw.trim() : educationRaw;
  }
  if (qualificationRaw !== undefined) {
    updates.qualification = typeof qualificationRaw === 'string' ? qualificationRaw.trim() : qualificationRaw;
  }

  const githubUsername = body.githubUsername || body.github_username;
  if (githubUsername !== undefined) {
    let trimmed = String(githubUsername || '').trim();
    // If a GitHub URL was provided, extract the username
    try {
      const urlLike = trimmed.replace(/^git@github:\/\//, '');
      if (/^https?:\/\//i.test(urlLike) || urlLike.includes('github.com')) {
        // Normalize and parse
        let u = urlLike;
        if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
        const parsed = new URL(u);
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length > 0) {
          trimmed = parts[0];
        }
      }
    } catch (e) {
      // ignore URL parse errors and fall back to raw trimmed value
    }
    // Remove leading @ if present
    if (trimmed.startsWith('@')) trimmed = trimmed.substring(1);
    // Validate GitHub username (1-39 chars, alphanumeric or hyphens, cannot start/end with hyphen)
    const ghValid = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(trimmed);
    if (ghValid) updates.github_username = trimmed;
  }

  const experienceValue = body.experienceSummary || body.experience_summary || body.experience;
  if (experienceValue !== undefined && experienceValue !== null && String(experienceValue).trim() !== '') {
    const trimmed = String(experienceValue).trim();
    const numericExperience = Number(trimmed);

    if (Number.isFinite(numericExperience) && /^\d+(?:\.\d+)?$/.test(trimmed)) {
      updates.experience_years = numericExperience;
      updates.experience_summary = null;
    } else {
      updates.experience_summary = trimmed;
    }
  }

  // New profile fields
  const phone = body.phone;
  const location = body.location;
  const website = body.website;
  const company = body.company;
  const yearsOfExperience = body.yearsOfExperience;
  const specialization = body.specialization;
  const socialLinks = body.socialLinks;

  // Validate and sanitize inputs
  if (phone !== undefined) {
    const trimmed = String(phone || '').trim().substring(0, 20);
    if (trimmed !== '') updates.phone = trimmed;
  }
  if (location !== undefined) {
    const trimmed = String(location || '').trim().substring(0, 100);
    if (trimmed !== '') updates.location = trimmed;
  }
  if (website !== undefined) {
    let sanitizedWebsite = String(website || '').trim();
    if (sanitizedWebsite !== '') {
      if (!sanitizedWebsite.startsWith('http')) {
        sanitizedWebsite = `https://${sanitizedWebsite}`;
      }
      updates.website = sanitizedWebsite.substring(0, 200);
    }
  }
  if (company !== undefined) {
    const trimmed = String(company || '').trim().substring(0, 100);
    if (trimmed !== '') updates.company = trimmed;
  }
  if (yearsOfExperience !== undefined) {
    const trimmed = String(yearsOfExperience || '').trim().substring(0, 20);
    if (trimmed !== '') updates.years_of_experience = trimmed;
  }
  if (specialization !== undefined) {
    const trimmed = String(specialization || '').trim().substring(0, 100);
    if (trimmed !== '') updates.specialization = trimmed;
  }
  if (socialLinks !== undefined) {
    // Ensure social_links is a valid JSON object
    try {
      const parsed = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
      if (typeof parsed === 'object' && parsed !== null) {
        updates.social_links = parsed;
      }
    } catch (e) {
      console.error('Invalid social_links format:', e);
    }
  }

  // Individual social links
  if (body.twitter !== undefined) {
    const t = String(body.twitter || '').trim().substring(0, 50);
    if (t !== '') updates.twitter = t;
  }
  if (body.linkedin !== undefined) {
    const l = String(body.linkedin || '').trim().substring(0, 50);
    if (l !== '') updates.linkedin = l;
  }
  if (body.portfolio !== undefined) {
    const p = String(body.portfolio || '').trim().substring(0, 200);
    if (p !== '') updates.portfolio = p;
  }
  if (body.dribbble !== undefined) {
    const d = String(body.dribbble || '').trim().substring(0, 50);
    if (d !== '') updates.dribbble = d;
  }

  if (body.is_public !== undefined) {
    updates.is_public = Boolean(body.is_public);
  }

  return updates;
};

export { normalizeProfileUpdatePayload };
