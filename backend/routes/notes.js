import express from "express";
import { supabaseAdmin } from "../db/supabaseClient.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Save a bookmark
router.post("/bookmark", authenticateToken, async (req, res) => {
    try {
        const { questionId, questionTitle, questionType, tags, note } = req.body;

        if (!questionId) {
            return res.status(400).json({ error: 'questionId is required' });
        }
        // Check if already bookmarked
        const { data: existing } = await supabaseAdmin
            .from("bookmarks")
            .select("id")
            .eq("user_id", req.user.id)
            .eq("question_id", questionId)
            .single();

        if (existing) {
            return res.status(400).json({ error: "Already bookmarked" });
        }

        const { data, error } = await supabaseAdmin
            .from("bookmarks")
            .insert({
                user_id: req.user.id,
                question_id: questionId,
                question_title: questionTitle || "Untitled",
                question_type: questionType || "dsa",
                tags: tags || [],
                note: note || "",
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ bookmark: data });
    } catch (error) {
        console.error("Bookmark error:", error);
        res.status(500).json({ error: "Failed to save bookmark" });
    }
});

// Get all bookmarks with optional filters
router.get("/bookmarks", authenticateToken, async (req, res) => {
    try {
        const { tag, type, search } = req.query;

        let query = supabaseAdmin
            .from("bookmarks")
            .select("*")
            .eq("user_id", req.user.id)
            .order("created_at", { ascending: false });

        if (type && type !== "all") {
            query = query.eq("question_type", type);
        }

        const { data, error } = await query;
        if (error) throw error;

        let bookmarks = data || [];

        // Client-side tag filtering (Supabase array containment)
        if (tag && tag !== "all") {
            bookmarks = bookmarks.filter(b => b.tags?.includes(tag));
        }

        if (search) {
            const s = search.toLowerCase();
            bookmarks = bookmarks.filter(b =>
                b.question_title?.toLowerCase().includes(s) ||
                b.note?.toLowerCase().includes(s)
            );
        }

        res.json({ bookmarks });
    } catch (error) {
        console.error("Fetch bookmarks error:", error);
        res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
});

// Update bookmark note
router.put("/bookmark/:id/note", authenticateToken, async (req, res) => {
    try {
        const { note, tags } = req.body;
        const updateData = {};
        if (note !== undefined) updateData.note = note;
        if (tags !== undefined) updateData.tags = tags;

        const { data, error } = await supabaseAdmin
            .from("bookmarks")
            .update(updateData)
            .eq("id", req.params.id)
            .eq("user_id", req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ bookmark: data });
    } catch (error) {
        console.error("Update bookmark error:", error);
        res.status(500).json({ error: "Failed to update bookmark" });
    }
});

// Delete bookmark
router.delete("/bookmark/:id", authenticateToken, async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from("bookmarks")
            .delete()
            .eq("id", req.params.id)
            .eq("user_id", req.user.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error("Delete bookmark error:", error);
        res.status(500).json({ error: "Failed to delete bookmark" });
    }
});

export default router;
