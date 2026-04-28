const normalizeProfileUpdatePayload = (body = {}) => {
  const updates = {};

  const fullName = body.fullName || body.full_name;
  const experienceLevel = body.experienceLevel || body.experience_level;
  const currentRole = body.currentRole || body.current_role || body.designation;
  const bio = body.bio;
  const skills = body.skills;
  const education = body.education;

  if (fullName) updates.full_name = fullName;
  if (experienceLevel) updates.experience_level = experienceLevel;
  if (currentRole) updates.designation = currentRole;
  if (bio !== undefined) updates.bio = bio;
  if (skills !== undefined) updates.skills = skills;
  if (education !== undefined) updates.education = education;

  const githubUsername = body.githubUsername || body.github_username;
  if (githubUsername !== undefined) updates.github_username = githubUsername;

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
    updates.phone = sanitizedPhone;
  }
  if (location !== undefined) {
    const sanitizedLocation = String(location || '').trim().substring(0, 100);
    updates.location = sanitizedLocation;
  }
  if (website !== undefined) {
    let sanitizedWebsite = String(website || '').trim();
    // Ensure URL starts with http/https
    if (sanitizedWebsite && !sanitizedWebsite.startsWith('http')) {
      sanitizedWebsite = sanitizedWebsite.startsWith('www.') 
        ? `https://${sanitizedWebsite}` 
        : `https://${sanitizedWebsite}`;
    }
    updates.website = sanitizedWebsite.substring(0, 200);
  }
  if (company !== undefined) {
    const sanitizedCompany = String(company || '').trim().substring(0, 100);
    updates.company = sanitizedCompany;
  }
  if (yearsOfExperience !== undefined) {
    const sanitizedYears = String(yearsOfExperience || '').trim().substring(0, 20);
    updates.years_of_experience = sanitizedYears;
  }
  if (specialization !== undefined) {
    const sanitizedSpecialization = String(specialization || '').trim().substring(0, 100);
    updates.specialization = sanitizedSpecialization;
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
  if (body.twitter !== undefined) updates.twitter = String(body.twitter || '').trim().substring(0, 50);
  if (body.linkedin !== undefined) updates.linkedin = String(body.linkedin || '').trim().substring(0, 50);
  if (body.portfolio !== undefined) updates.portfolio = String(body.portfolio || '').trim().substring(0, 200);
  if (body.dribbble !== undefined) updates.dribbble = String(body.dribbble || '').trim().substring(0, 50);

  return updates;
};

export { normalizeProfileUpdatePayload };