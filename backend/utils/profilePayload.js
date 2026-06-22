const normalizeProfileUpdatePayload = (body = {}) => {
  const updates = {};

  const fullNameRaw = body.fullName ?? body.full_name;
  const experienceLevelRaw = body.experienceLevel ?? body.experience_level;
  const currentRoleRaw = body.currentRole ?? body.current_role ?? body.designation;
  const bioRaw = body.bio ?? body.summary;
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

  const githubUsername = body.githubUsername ?? body.github_username;
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
    } catch (_e) {
      // ignore URL parse errors and fall back to raw trimmed value
    }
    // Remove leading @ if present
    if (trimmed.startsWith('@')) trimmed = trimmed.substring(1);
    // Validate GitHub username (1-39 chars, alphanumeric or hyphens, cannot start/end with hyphen)
    if (trimmed === '') {
      updates.github_username = null;
    } else {
      const ghValid = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(trimmed);
      if (ghValid) updates.github_username = trimmed;
    }
  }

  const experienceValue = body.experienceSummary ?? body.experience_summary ?? body.experience;
  if (experienceValue !== undefined && experienceValue !== null) {
    if (Array.isArray(experienceValue)) {
      if (experienceValue.length === 0) {
        updates.experience_summary = null;
        updates.experience_years = null;
      } else {
        updates.experience_summary = experienceValue.map(exp => {
          if (typeof exp === 'string') return exp;
          const title = exp.title || exp.role || exp.name || '';
          const company = exp.company || exp.employer || '';
          if (title && company) return `${title} at ${company}`;
          return title || company || JSON.stringify(exp);
        }).join('; ');
        updates.experience_years = null;
      }
    } else {
      const trimmed = String(experienceValue).trim();
      if (trimmed === '') {
        updates.experience_years = null;
        updates.experience_summary = null;
      } else {
        const numericExperience = Number(trimmed);

        if (Number.isFinite(numericExperience) && /^\d+(?:\.\d+)?$/.test(trimmed)) {
          updates.experience_years = numericExperience;
          updates.experience_summary = null;
        } else {
          updates.experience_summary = trimmed;
          updates.experience_years = null;
        }
      }
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
    updates.phone = String(phone || '').trim().substring(0, 20);
  }
  if (location !== undefined) {
    updates.location = String(location || '').trim().substring(0, 100);
  }
  if (website !== undefined) {
    let sanitizedWebsite = String(website || '').trim();
    if (sanitizedWebsite !== '') {
      if (!sanitizedWebsite.startsWith('http')) {
        sanitizedWebsite = `https://${sanitizedWebsite}`;
      }
      updates.website = sanitizedWebsite.substring(0, 200);
    } else {
      updates.website = '';
    }
  }
  if (company !== undefined) {
    updates.company = String(company || '').trim().substring(0, 100);
  }
  if (yearsOfExperience !== undefined) {
    updates.years_of_experience = String(yearsOfExperience || '').trim().substring(0, 20);
  }
  if (specialization !== undefined) {
    updates.specialization = String(specialization || '').trim().substring(0, 100);
  }
  if (socialLinks !== undefined) {
    // Ensure social_links is a valid JSON object
    try {
      const parsed = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
      if (typeof parsed === 'object' && parsed !== null) {
        updates.social_links = parsed;
      }
    } catch (_e) {
      // ignore URL parse errors and fall back to raw trimmed value
    }
  }

  // Individual social links
  if (body.twitter !== undefined || body.linkedin !== undefined || body.portfolio !== undefined || body.dribbble !== undefined) {
    updates.social_links = updates.social_links || {};
    if (body.twitter !== undefined) updates.social_links.twitter = String(body.twitter || '').trim().substring(0, 50);
    if (body.linkedin !== undefined) updates.social_links.linkedin = String(body.linkedin || '').trim().substring(0, 50);
    if (body.portfolio !== undefined) updates.social_links.portfolio = String(body.portfolio || '').trim().substring(0, 200);
    if (body.dribbble !== undefined) updates.social_links.dribbble = String(body.dribbble || '').trim().substring(0, 50);
  }

  if (body.projects !== undefined) {
    updates.projects = body.projects;
  }
  if (body.certifications !== undefined) {
    updates.certifications = body.certifications;
  }

  if (body.is_public !== undefined) {
    updates.is_public = Boolean(body.is_public);
  }

  return updates;
};

export { normalizeProfileUpdatePayload };
