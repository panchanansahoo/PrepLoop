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

// Get all bookmarks with optional filters and bounded limit
router.get("/bookmarks", authenticateToken, async (req, res) => {
    try {
        const { tag, type, search } = req.query;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const offset = Math.max(0, (page - 1) * limit);

        let query = supabaseAdmin
            .from("bookmarks")
            .select("*", { count: "exact" })
            .eq("user_id", req.user.id);

        if (type && type !== "all") {
            query = query.eq("question_type", type);
        }

        query = query.order("created_at", { ascending: false });

        // If no in-memory filters (tag, search) are requested, use DB range pagination
        if ((!tag || tag === "all") && !search) {
            query = query.range(offset, offset + limit - 1);
            const { data, count, error } = await query;
            if (error) throw error;

            const bookmarks = data || [];
            const total = typeof count === 'number' ? count : bookmarks.length;
            return res.json({
                bookmarks,
                pagination: {
                    page,
                    limit,
                    total,
                    hasMore: offset + bookmarks.length < total,
                },
            });
        }

        // When tag or search is provided, filter records before slicing and metadata calculation
        const { data, error } = await query;
        if (error) throw error;

        let filtered = data || [];

        if (tag && tag !== "all") {
            filtered = filtered.filter(b => Array.isArray(b.tags) && b.tags.includes(tag));
        }

        if (search) {
            const s = String(search).toLowerCase();
            filtered = filtered.filter(b =>
                (b.question_title && b.question_title.toLowerCase().includes(s)) ||
                (b.note && b.note.toLowerCase().includes(s))
            );
        }

        const total = filtered.length;
        const bookmarks = filtered.slice(offset, offset + limit);

        res.json({
            bookmarks,
            pagination: {
                page,
                limit,
                total,
                hasMore: offset + bookmarks.length < total,
            },
        });
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
