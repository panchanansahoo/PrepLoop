const normalizeProfileUpdatePayload = (body = {}) => {
  const updates = {};

  const fullNameRaw = body.fullName || body.full_name;
  const experienceLevelRaw = body.experienceLevel || body.experience_level;
  const currentRoleRaw = body.currentRole || body.current_role || body.designation;
  const bioRaw = body.bio;
  const skillsRaw = body.skills;
  const educationRaw = body.education;

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
    if (typeof bioRaw === 'string') {
      const trimmed = bioRaw.trim();
      if (trimmed !== '') updates.bio = trimmed;
    } else {
      updates.bio = bioRaw;
    }
  }
  if (skillsRaw !== undefined) {
    if (typeof skillsRaw === 'string') {
      const trimmed = skillsRaw.trim();
      if (trimmed !== '') updates.skills = trimmed;
    } else {
      updates.skills = skillsRaw;
    }
  }
  if (educationRaw !== undefined) {
    if (typeof educationRaw === 'string') {
      const trimmed = educationRaw.trim();
      if (trimmed !== '') updates.education = trimmed;
    } else {
      updates.education = educationRaw;
    }
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
    const sanitizedPhone = String(phone || '').trim().substring(0, 20);
    if (sanitizedPhone !== '') updates.phone = sanitizedPhone;
  }
  if (location !== undefined) {
    const sanitizedLocation = String(location || '').trim().substring(0, 100);
    if (sanitizedLocation !== '') updates.location = sanitizedLocation;
  }
  if (website !== undefined) {
    let sanitizedWebsite = String(website || '').trim();
    // Ensure URL starts with http/https
    if (sanitizedWebsite && !sanitizedWebsite.startsWith('http')) {
      sanitizedWebsite = sanitizedWebsite.startsWith('www.') 
        ? `https://${sanitizedWebsite}` 
        : `https://${sanitizedWebsite}`;
    }
    sanitizedWebsite = sanitizedWebsite.substring(0, 200);
    if (sanitizedWebsite !== '') updates.website = sanitizedWebsite;
  }
  if (company !== undefined) {
    const sanitizedCompany = String(company || '').trim().substring(0, 100);
    if (sanitizedCompany !== '') updates.company = sanitizedCompany;
  }
  if (yearsOfExperience !== undefined) {
    const sanitizedYears = String(yearsOfExperience || '').trim().substring(0, 20);
    if (sanitizedYears !== '') updates.years_of_experience = sanitizedYears;
  }
  if (specialization !== undefined) {
    const sanitizedSpecialization = String(specialization || '').trim().substring(0, 100);
    if (sanitizedSpecialization !== '') updates.specialization = sanitizedSpecialization;
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

  // Portfolio-specific fields
  if (body.projects !== undefined) {
    try {
      const parsed = typeof body.projects === 'string' ? JSON.parse(body.projects) : body.projects;
      if (Array.isArray(parsed)) {
        updates.projects = parsed.slice(0, 20).map(p => ({
          name: String(p.name || '').trim().substring(0, 100),
          description: String(p.description || '').trim().substring(0, 500),
          technologies: Array.isArray(p.technologies) ? p.technologies.slice(0, 10) : [],
          link: String(p.link || p.url || p.html_url || '').trim().substring(0, 200),
          source: String(p.source || 'manual').trim(),
          stars: typeof p.stars === 'number' ? p.stars : undefined,
          language: String(p.language || '').trim()
        }));
      }
    } catch (e) {
      console.error('Invalid projects format:', e);
    }
  }

  if (body.certifications !== undefined) {
    try {
      const parsed = typeof body.certifications === 'string' ? JSON.parse(body.certifications) : body.certifications;
      if (Array.isArray(parsed)) {
        updates.certifications = parsed.slice(0, 20).map(c =>
          typeof c === 'string' ? c.trim().substring(0, 200) : {
            name: String(c.name || '').trim().substring(0, 200),
            issuer: String(c.issuer || '').trim().substring(0, 100),
            date: String(c.date || '').trim().substring(0, 50)
          }
        );
      }
    } catch (e) {
      console.error('Invalid certifications format:', e);
    }
  }

  if (body.portfolio_data !== undefined || body.portfolioData !== undefined) {
    try {
      const raw = body.portfolio_data || body.portfolioData;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof parsed === 'object' && parsed !== null) {
        updates.portfolio_data = {
          headline: String(parsed.headline || '').trim().substring(0, 200),
          highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 10) : [],
          resumeAtsScore: typeof parsed.resumeAtsScore === 'number' ? parsed.resumeAtsScore : undefined,
          lastImportSource: String(parsed.lastImportSource || '').trim(),
          lastImportAt: parsed.lastImportAt || null,
          themePreference: String(parsed.themePreference || 'default').trim()
        };
      }
    } catch (e) {
      console.error('Invalid portfolio_data format:', e);
    }
  }

  if (body.import_sources !== undefined || body.importSources !== undefined) {
    try {
      const raw = body.import_sources || body.importSources;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof parsed === 'object' && parsed !== null) {
        updates.import_sources = parsed;
      }
    } catch (e) {
      console.error('Invalid import_sources format:', e);
    }
  }

  // Calculate profile completion percentage
  const completionFields = [
    updates.full_name || body.fullName || body.full_name,
    updates.bio || body.bio,
    updates.designation || body.currentRole || body.designation,
    updates.company || body.company,
    updates.location || body.location,
    updates.skills || body.skills,
    updates.education || body.education,
    updates.phone || body.phone,
    updates.website || body.website,
    updates.experience_summary || body.experience || body.experienceSummary,
  ];
  const filledCount = completionFields.filter(v => String(v || '').trim().length > 0).length;
  const pct = Math.round((filledCount / completionFields.length) * 100);
  if (pct > 0) {
    updates.profile_completion_pct = pct;
  }

  return updates;
};

export { normalizeProfileUpdatePayload };