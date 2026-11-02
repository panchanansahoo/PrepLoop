import express from "express";
import multer from "multer";
import { supabaseAdmin } from "../../db/supabaseClient.js";
import { authenticateToken, optionalAuth, isAdminEmail } from "../../middleware/auth.js";
import { buildAvatarPath, claimCustomUrl } from "../../utils/profileUtils.js";
import { normalizeProfileUpdatePayload } from "../../utils/profilePayload.js";
import cacheManager from "../../utils/cacheManager.js";
import {
  buildProfileResponse,
  awardProfileCompletionCoins,
} from "../../services/profileService.js";

// Multer memory storage for small avatar uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const isProfilesAccessBlocked = (error) => {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();
  return code === "42P17" || message.includes("infinite recursion detected in policy");
};

const router = express.Router();
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const cacheKey = `profile:${req.user.id}`;
    let profile = await cacheManager.get(cacheKey).catch(() => null);

    if (profile) {
      if ((req.user?.role === 'admin' || isAdminEmail(req.user?.email)) && profile.role !== 'admin') {
        profile.role = 'admin';
        supabaseAdmin.from("profiles").update({ role: 'admin' }).eq("id", req.user.id).catch(() => {});
      }
      cacheManager.set(cacheKey, profile, 60).catch(() => {});
      return res.json(buildProfileResponse(req, profile));
    }

    const { data: fetchedProfile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();

    profile = fetchedProfile;

    if (isProfilesAccessBlocked(error)) {
      return res.json({
        ...buildProfileResponse(req, {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || '',
          subscription_tier: 'free',
          experience_level: 'beginner',
          role: req.user.role || 'user',
        }),
        degraded: true,
      });
    }

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }

    if (profile) {
      if ((req.user?.role === 'admin' || isAdminEmail(req.user?.email)) && profile.role !== 'admin') {
        profile.role = 'admin';
        supabaseAdmin.from("profiles").update({ role: 'admin' }).eq("id", req.user.id).catch(() => {});
      }
      cacheManager.set(cacheKey, profile, 60).catch(() => {});
      return res.json(buildProfileResponse(req, profile));
    }

    // Create profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: req.user.id,
        full_name: req.user.user_metadata?.full_name || '',
        subscription_tier: 'free',
        experience_level: 'beginner',
        role: req.user.role || (isAdminEmail(req.user.email) ? 'admin' : 'user'),
        
        // New profile fields
        phone: '',
        location: '',
        website: '',
        company: '',
        years_of_experience: '',
        specialization: '',
        social_links: {}
      })
      .select()
      .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        return res.json({
          ...buildProfileResponse(req, {
            id: req.user.id,
            email: req.user.email,
            full_name: req.user.user_metadata?.full_name || '',
            subscription_tier: 'free',
            experience_level: 'beginner',
            role: req.user.role || 'user',
            
            // New profile fields for degraded response
            phone: '',
            location: '',
            website: '',
            company: '',
            years_of_experience: '',
            specialization: '',
            social_links: {}
          }),
          degraded: true,
        });
      }

      return res.json(buildProfileResponse(req, newProfile));
  } catch (error) {
    console.error("Error fetching profile:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.json({
        ...buildProfileResponse(req, {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || '',
          subscription_tier: 'free',
          experience_level: 'beginner',
          role: req.user.role || 'user',
          
          // New profile fields for degraded response
          phone: '',
          location: '',
          website: '',
          company: '',
          years_of_experience: '',
          specialization: '',
          social_links: {}
        }),
        degraded: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.get('/portfolio/public/:slug', optionalAuth, async (req, res) => {
  try {
    const rawSlug = String(req.params.slug || '').trim().toLowerCase();
    if (!rawSlug) return res.status(400).json({ error: 'slug required' });

    // 1. Try by custom_url first
    const { data: initialProfile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('custom_url', rawSlug)
      .maybeSingle();

    let profile = initialProfile;

    if (error) {
      console.error('Error fetching public profile by custom_url:', error);
    }

    // 2. Fallback: try by id (only if rawSlug is a valid UUID to prevent Postgres 22P02 error)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawSlug);
    if (!profile && isUUID) {
      const byId = await supabaseAdmin.from('profiles').select('*').eq('id', rawSlug).maybeSingle();
      if (!byId.error && byId.data) {
        profile = byId.data;
      }
    }

    // 3. Fallback: try by slugified full_name (e.g. "panchanan-sahoo" -> "Panchanan Sahoo")
    if (!profile) {
      const nameFromSlug = rawSlug.replace(/[-_]+/g, ' ').trim();
      const byName = await supabaseAdmin.from('profiles').select('*').ilike('full_name', nameFromSlug).maybeSingle();
      if (!byName.error && byName.data) {
        profile = byName.data;
      }
    }

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const isOwner = Boolean(req.user?.id && profile.id === req.user.id);

    if (!profile.is_public && !isOwner) {
      return res.status(403).json({ error: 'This profile is private' });
    }

    // Parse social links
    let parsedSocialLinks = {};
    if (typeof profile.social_links === 'string') {
      try { parsedSocialLinks = JSON.parse(profile.social_links); } catch (_e) {}
    } else if (typeof profile.social_links === 'object' && profile.social_links !== null) {
      parsedSocialLinks = profile.social_links;
    }

    // Build a lightweight portfolio object expected by frontend
    const basics = {
      name: profile.full_name || profile.fullName || 'PrepLoop Member',
      title: profile.designation || profile.current_role || profile.currentRole || '',
      photo: profile.avatar_url || profile.avatarUrl || '',
      location: profile.location || '',
      email: profile.email || '',
      website: profile.website || '',
      summary: profile.bio || ''
    };

    const socials = {
      github: profile.github_username || profile.githubUsername || '',
      linkedin: profile.linkedin || parsedSocialLinks.linkedin || '',
      twitter: profile.twitter || parsedSocialLinks.twitter || '',
      portfolio: profile.portfolio || parsedSocialLinks.portfolio || ''
    };

    const skillsList = (String(profile.skills || '')).split(',').map(s => s.trim()).filter(Boolean);

    let experience = [];
    if (Array.isArray(profile.experience)) {
      experience = profile.experience;
    } else if (typeof profile.experience === 'string' && profile.experience.trim()) {
      experience = profile.experience.split(/\n|\.|;/).map(s => s.trim()).filter(Boolean);
    } else if (profile.experience_summary) {
      experience = profile.experience_summary.split(/\n|\.|;/).map(s => s.trim()).filter(Boolean);
    }

    let education = [];
    if (Array.isArray(profile.education)) {
      education = profile.education;
    } else if (profile.education) {
      education = [profile.education];
    }

    let projects = [];
    if (Array.isArray(profile.projects)) {
      projects = profile.projects;
    } else if (typeof profile.projects === 'string') {
      try { projects = JSON.parse(profile.projects); } catch (_e) {}
    }

    let achievements = [];
    if (Array.isArray(profile.certifications)) {
      achievements = profile.certifications;
    } else if (typeof profile.certifications === 'string') {
      try { achievements = JSON.parse(profile.certifications); } catch (_e) {}
    }

    const portfolio = {
      basics,
      socials,
      skills: { languages: skillsList, frameworks: [], tools: [], domains: [] },
      experience,
      education,
      projects: Array.isArray(projects) ? projects : [],
      achievements: Array.isArray(achievements) ? achievements : [],
      openSource: { totalStars: 0, totalRepos: 0 },
      portfolioMeta: {
        template: 'minimal-professional',
        theme: profile.profile_theme || 'aurora',
        slug: profile.custom_url || rawSlug,
        visibility: profile.is_public ? 'public' : 'private',
        isOwner
      }
    };

    res.json({ portfolio });
  } catch (error) {
    console.error('Error fetching public portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const updates = normalizeProfileUpdatePayload(req.body);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.updated_at = new Date().toISOString();

    const updateResult = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .maybeSingle();
    let data = updateResult.data;
    const { error } = updateResult;

    if (error) {
      console.error('Profile update error:', error);
      if (isProfilesAccessBlocked(error)) {
        return res.status(503).json({ error: "Profile update is temporarily unavailable", degraded: true });
      }
      throw error;
    }

    if (!data) {
      const createResult = await supabaseAdmin
        .from("profiles")
        .insert({
          id: req.user.id,
          email: req.user.email,
          full_name: updates.full_name || req.user.user_metadata?.full_name || '',
          subscription_tier: updates.subscription_tier || 'free',
          experience_level: updates.experience_level || 'beginner',
          role: updates.role || req.user.role || 'user',
          ...updates,
        })
        .select()
        .maybeSingle();

      if (createResult.error) {
        console.error('Profile creation during update error:', createResult.error);
        if (isProfilesAccessBlocked(createResult.error)) {
          return res.status(503).json({ error: "Profile update is temporarily unavailable", degraded: true });
        }
        throw createResult.error;
      }

      data = createResult.data;
    }

    if (!data) {
      return res.status(500).json({ error: "Failed to save profile" });
    }

    let rewardResult = { coinsAwarded: 0, coinBalance: data?.coins ?? 0, applied: false };
    let rewardDegraded = false;

    try {
      rewardResult = await awardProfileCompletionCoins(req.user.id, data);
    } catch (rewardError) {
      rewardDegraded = true;
      console.error('Profile completion reward error:', rewardError);
    }

    const responsePayload = {
      ...buildProfileResponse(req, data),
      coinsAwarded: rewardResult.coinsAwarded,
      coinBalance: rewardResult.coinBalance,
      profileCompletionRewardApplied: rewardResult.applied,
      profileCompletionRewardDegraded: rewardDegraded,
    };
    await cacheManager.delete(`profile:${req.user.id}`).catch(() => {});
    res.json(responsePayload);
  } catch (error) {
    console.error("Error updating profile:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({ error: "Profile update is temporarily unavailable", degraded: true });
    }
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post('/profile/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = buildAvatarPath(req.user.id, file.originalname);

    // Upload to Supabase storage (requires a bucket named 'avatars')
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload avatar' });
    }

    // Get public URL
    const { data: publicData } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = publicData?.publicUrl || null;

    // Update profile record
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', req.user.id);

    if (updateError) {
      console.error('Profile avatar update error:', updateError);
      return res.status(500).json({ error: 'Failed to update profile avatar' });
    }

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to fetch profile after avatar update:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    return res.json(buildProfileResponse(req, profile));
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

router.post('/profile/claim-url', authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated' });

    let requested = String(req.body?.custom_url || '').trim().toLowerCase();
    requested = requested.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!requested) return res.status(400).json({ error: 'custom_url is required' });

    if (requested.length < 3 || requested.length > 30) {
      return res.status(400).json({ error: 'Custom URL must be between 3 and 30 characters' });
    }

    try {
      const result = await claimCustomUrl(supabaseAdmin, req.user.id, requested);
      if (!result.success) {
        if (result.error === 'taken') return res.status(409).json({ error: 'This custom URL is already taken' });
        if (result.error === 'reserved') return res.status(400).json({ error: 'This custom URL is reserved' });
        if (result.error === 'format') return res.status(400).json({ error: 'Invalid custom_url format. Use 3-30 chars: a-z, 0-9, -' });
        return res.status(400).json({ error: 'Invalid custom_url' });
      }

      const profileRow = result.profile || (await supabaseAdmin.from('profiles').select('*').eq('id', req.user.id).maybeSingle()).data;
      return res.json(buildProfileResponse(req, profileRow));
    } catch (err) {
      console.error('Claim URL error:', err);
      return res.status(500).json({ error: 'Failed to claim custom_url' });
    }
  } catch (error) {
    console.error('Claim URL error:', error);
    res.status(500).json({ error: 'Failed to claim custom_url' });
  }
});

router.get("/settings", authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (isProfilesAccessBlocked(error)) {
      return res.json({
        settings: {
          full_name: req.user.user_metadata?.full_name || '',
          experience_level: 'beginner',
          subscription_tier: 'free',
        },
        degraded: true,
      });
    }

    if (error || !profile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      settings: {
        full_name: profile.full_name,
        experience_level: profile.experience_level,
        subscription_tier: profile.subscription_tier,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.json({
        settings: {
          full_name: req.user.user_metadata?.full_name || '',
          experience_level: 'beginner',
          subscription_tier: 'free',
        },
        degraded: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/settings", authenticateToken, async (req, res) => {
  try {
    const { fullName, experienceLevel } = req.body;
    const updates = {};
    if (fullName) updates.full_name = fullName;
    if (experienceLevel) updates.experience_level = experienceLevel;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      settings: {
        full_name: data.full_name,
        experience_level: data.experience_level,
        subscription_tier: data.subscription_tier,
      },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({ error: "Settings update is temporarily unavailable", degraded: true });
    }
    res.status(500).json({ error: "Failed to update settings" });
  }
});

router.post("/preferences", authenticateToken, async (req, res) => {
  try {
    const { experienceLevel, goals: _goals, targetCompanies: _targetCompanies } = req.body;
    const updates = {};
    if (experienceLevel) updates.experience_level = experienceLevel;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", req.user.id);

      if (error) throw error;
    }

    res.json({ success: true, message: "Preferences saved" });
  } catch (error) {
    console.error("Error saving preferences:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({ error: "Preferences update is temporarily unavailable", degraded: true });
    }
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

export default router;
