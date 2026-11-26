import express from "express";
import multer from "multer";
import { authenticateToken, optionalAuth } from "../../middleware/auth.ts";
import { invalidateCache } from "../../middleware/apiCache.js";
import { requireValidFileSignature, uploadEndpointsLimiter } from "../../middleware/uploadProtection.js";
import { clearSessionCookies } from "../auth/helpers.js";
import {
  getOrCreateUserProfile,
  getPublicPortfolioBySlug,
  updateUserProfile,
  uploadUserAvatar,
  claimUserCustomUrl,
  getUserSettings,
  updateUserSettings,
  updateUserPreferences,
  getGithubAutofillProfile,
  deleteUserAccount,
  isProfilesAccessBlocked,
} from "../../services/profileService.ts";

// Multer memory storage for small avatar uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = express.Router();

/**
 * GET /api/user/profile
 * Retrieves or creates profile with caching and fallback degradation
 */
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const response = await getOrCreateUserProfile(req.user);
    return res.json(response);
  } catch (error) {
    console.error("Error fetching profile:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({ error: "Profile temporarily unavailable", degraded: true });
    }
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * GET /api/user/portfolio/public/:slug
 * Resolves public portfolio views by custom slug, UUID, or full name
 */
router.get("/portfolio/public/:slug", optionalAuth, async (req, res) => {
  res.set("Cache-Control", "private, no-store");
  try {
    const rawSlug = String(req.params.slug || '').trim();
    if (!rawSlug) return res.status(400).json({ error: 'slug required' });

    const result = await getPublicPortfolioBySlug(rawSlug, req.user?.id);
    if (result.notFound) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    if (result.isPrivate) {
      return res.status(403).json({ error: 'This profile is private' });
    }
    return res.json({ portfolio: result });
  } catch (error) {
    console.error("Error fetching public portfolio:", error);
    return res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

/**
 * PUT /api/user/profile
 * Updates profile fields, triggers completion rewards, and invalidates cache
 */
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const responsePayload = await updateUserProfile(req.user.id, req.user, req.body);
    invalidateCache(`/api/user/profile/${req.user.id}`);
    invalidateCache('/api/user/portfolio');
    return res.json(responsePayload);
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error.status) {
      return res.status(error.status).json({ error: error.message, degraded: error.degraded });
    }
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * POST /api/user/profile/avatar
 * Multipart avatar image upload with automatic storage URL linking
 */
router.post("/profile/avatar", authenticateToken, uploadEndpointsLimiter, upload.single("avatar"), requireValidFileSignature(['image']), async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "User not authenticated" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const response = await uploadUserAvatar(req.user.id, req.user, req.file);
    invalidateCache(`/api/user/profile/${req.user.id}`);
    invalidateCache('/api/user/portfolio');
    return res.json(response);
  } catch (error) {
    console.error("Avatar upload error:", error);
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to upload avatar" });
  }
});

/**
 * POST /api/user/profile/claim-url
 * Validates and claims unique custom portfolio slug
 */
router.post("/profile/claim-url", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "User not authenticated" });
    const response = await claimUserCustomUrl(req.user.id, req.user, req.body?.custom_url);
    invalidateCache(`/api/user/profile/${req.user.id}`);
    invalidateCache('/api/user/portfolio');
    return res.json(response);
  } catch (error) {
    console.error("Claim URL error:", error);
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to claim custom_url" });
  }
});

/**
 * POST /api/user/profile/github-autofill
 * Fetches public GitHub profile & top repositories to auto-fill blank profile fields
 */
router.post("/profile/github-autofill", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "User not authenticated" });
    const rawUsername = req.body?.githubUsername ?? req.body?.username ?? '';
    const result = await getGithubAutofillProfile(rawUsername);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("GitHub autofill error:", error);
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to fetch GitHub profile" });
  }
});

/**
 * GET /api/user/settings
 * Retrieves user experience and subscription settings
 */
router.get("/settings", authenticateToken, async (req, res) => {
  try {
    const result = await getUserSettings(req.user.id, req.user);
    return res.json(result);
  } catch (error) {
    console.error("Error fetching settings:", error);
    if (error.status) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/**
 * PUT /api/user/settings
 * Updates settings
 */
router.put("/settings", authenticateToken, async (req, res) => {
  try {
    const result = await updateUserSettings(req.user.id, req.body, req.user);
    invalidateCache(`/api/user/settings/${req.user.id}`);
    invalidateCache(`/api/user/profile/${req.user.id}`);
    return res.json(result);
  } catch (error) {
    console.error("Error updating settings:", error);
    if (error.status) return res.status(error.status).json({ error: error.message, degraded: error.degraded });
    return res.status(500).json({ error: "Failed to update settings" });
  }
});

/**
 * DELETE /api/user/account
 * Permanently deletes the authenticated user's account
 */
router.delete("/account", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const confirmation = String(req.body?.confirmation || '').trim().toUpperCase();
    if (confirmation !== 'DELETE') {
      return res.status(400).json({ error: 'Please type DELETE to confirm account deletion.' });
    }

    await deleteUserAccount(req.user.id);
    clearSessionCookies(res);
    invalidateCache(`/api/user/settings/${req.user.id}`);
    invalidateCache(`/api/user/profile/${req.user.id}`);
    invalidateCache('/api/user/portfolio');
    return res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    if (error.status) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

/**
 * POST /api/user/preferences
 * Saves target experience preferences
 */
router.post("/preferences", authenticateToken, async (req, res) => {
  try {
    const result = await updateUserPreferences(req.user.id, req.body);
    invalidateCache(`/api/user/preferences/${req.user.id}`);
    invalidateCache(`/api/user/profile/${req.user.id}`);
    return res.json(result);
  } catch (error) {
    console.error("Error saving preferences:", error);
    if (error.status) return res.status(error.status).json({ error: error.message, degraded: error.degraded });
    return res.status(500).json({ error: "Failed to save preferences" });
  }
});

export default router;
